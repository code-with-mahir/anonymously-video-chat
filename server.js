require('dotenv').config({ override: true });

/**
 * ============================================================================
 * TALKOYE VIDEO CHAT - SCALABLE BACKEND SERVER (Redis-backed, cluster-ready)
 * ============================================================================
 *
 * THIS REVISION fixes 4 correctness bugs found during real multi-process
 * testing. All 4 traced back to the same root cause: the previous version
 * had no way to (a) atomically claim a match without a race, and (b) detect
 * that a Redis-backed "user" was actually dead. Specifically:
 *
 *   FIX 1 - ATOMIC MATCH CLAIMING (Lua script, compare-and-swap on `status`)
 *      Previously, two processes could both "peek" the same waiting user and
 *      both decide to match with them, or a user could get matched twice
 *      (once by us, once by someone else) in the same instant. Every match
 *      now goes through claimUser(), a Lua script that atomically flips a
 *      user's status from 'searching' to 'matched' ONLY if it is still
 *      'searching' at the moment the script runs. If the flip fails, that
 *      candidate is either already taken, or dead (no hash = no match).
 *      This is what fixes ghost-matching too: a Lua HGET on a missing/expired
 *      key returns nil, which never equals 'searching', so claiming a ghost
 *      always safely fails.
 *
 *   FIX 2 - ATOMIC PARTNER RELEASE (Lua script, compare-and-swap on `roomId`)
 *      Previously, when user A left a room, the server unconditionally reset
 *      partner B's Redis state to 'idle'. If B had ALREADY auto-re-searched
 *      in that same instant (a very common race - your client auto-searches
 *      the moment it sees 'stranger-disconnected'), this clobbered B's brand
 *      new 'searching' state back to 'idle' while B's socket ID was still
 *      sitting in a waiting-pool list - a permanent zombie that nothing could
 *      ever match again. releaseIfRoomMatches() only resets a partner if
 *      their roomId still equals the room being closed; if they've already
 *      moved on, we leave their newer state alone.
 *
 *   FIX 3 - TTL-BASED PRESENCE + HEARTBEAT
 *      Previously, restarting a Node process left its users' Redis hashes
 *      and pool-list entries behind FOREVER, since nothing ever cleaned
 *      them up. Every user hash now carries a TTL (PRESENCE_TTL_SECONDS),
 *      refreshed by a periodic heartbeat for every socket a process still
 *      owns. If a process dies, its users' hashes simply expire instead of
 *      persisting as permanent ghosts.
 *
 *   FIX 4 - SELF-HEALING POOL SCANS
 *      When a candidate is peeked from a waiting-pool list but their hash
 *      no longer exists (expired/never existed), they're now opportunistically
 *      removed from that list on the spot, instead of sitting there forever
 *      as dead weight that every future search has to skip over.
 *
 * ACCEPTED LIMITATION (unchanged from before): the 60s keyword-to-random
 * fallback timer is still a local setTimeout. If the process holding it
 * restarts, that one fallback is lost - the user just remains in the pool
 * until matched or until they search again. A fully crash-safe version of
 * this would use a persistent delayed job queue (e.g. BullMQ); intentionally
 * out of scope here.
 *
 * DEPLOYMENT REQUIREMENTS (unchanged):
 *   - Redis reachable via REDIS_URL
 *   - npm install ioredis @socket.io/redis-adapter dotenv
 *   - Sticky sessions on your load balancer once you run multiple
 *     processes/machines behind one (infra config, not fixable here)
 *   - pm2 start server.js -i max --name talkoye
 * ============================================================================
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// 👇 NAYI LINE YAHAN PASTE KAREIN (Ye check karegi ki URL sahi aa raha hai ya nahi)
console.log('[REDIS CONFIG]', REDIS_URL.replace(/:[^:@]*@/, ':***@'));

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'https://talkoye.com', 'https://www.talkoye.com'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----------------------------------------------------------------------------
// REDIS SETUP
// ----------------------------------------------------------------------------

const redis = new Redis(REDIS_URL);
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();

redis.on('error', (err) => console.error('[REDIS ERROR - main client]', err.message));
pubClient.on('error', (err) => console.error('[REDIS ERROR - pub client]', err.message));
subClient.on('error', (err) => console.error('[REDIS ERROR - sub client]', err.message));

io.adapter(createAdapter(pubClient, subClient));

// ----------------------------------------------------------------------------
// ATOMIC LUA COMMANDS (this is the core correctness fix)
// ----------------------------------------------------------------------------

// Flips a user's status from 'searching' to 'matched' ONLY if it is still
// 'searching' right now. Returns 1 if we won the claim, 0 if someone else
// already claimed them, or if they don't exist at all (dead/expired hash).
redis.defineCommand('claimUser', {
    numberOfKeys: 1,
    lua: `
        if redis.call('HGET', KEYS[1], 'status') == 'searching' then
            redis.call('HSET', KEYS[1], 'status', 'matched')
            return 1
        else
            return 0
        end
    `,
});

// Resets a partner's status/partnerId/roomId back to idle ONLY IF their
// roomId still matches the room we're closing. If they've already moved on
// (new search, new match), we leave their current state untouched instead
// of clobbering it. Returns 1 if we reset them, 0 if we left them alone.
redis.defineCommand('releaseIfRoomMatches', {
    numberOfKeys: 1,
    lua: `
        local currentRoomId = redis.call('HGET', KEYS[1], 'roomId')
        if currentRoomId == ARGV[1] then
            redis.call('HSET', KEYS[1], 'status', 'idle', 'partnerId', '', 'roomId', '')
            return 1
        else
            return 0
        end
    `,
});

// ----------------------------------------------------------------------------
// STATE SCHEMA (Redis)
// ----------------------------------------------------------------------------
//   user:{socketId}          -> HASH  (TTL'd - see PRESENCE_TTL_SECONDS)
//   room:{roomId}             -> HASH
//   online:heartbeats         -> ZSET  (member=socketId, score=last-seen ms epoch)
//   pool:random:{gender}      -> LIST  (FIFO waiting pool bucketed by myGender)
//   pool:keyword:{keyword}    -> LIST  (FIFO waiting pool per keyword)
//   user:{socketId}:pools     -> SET   (which pool keys this user currently sits in)
// ----------------------------------------------------------------------------

const GENDERS = ['Male', 'Female', 'Other', 'Unknown'];
const MAX_SCAN_CANDIDATES = 30;
const PRESENCE_TTL_SECONDS = 45; // must be comfortably longer than HEARTBEAT_INTERVAL_MS
const HEARTBEAT_INTERVAL_MS = 15000;

const userKey = (id) => `user:${id}`;
const userPoolsKey = (id) => `user:${id}:pools`;
const roomKey = (id) => `room:${id}`;
const randomPoolKey = (gender) => `pool:random:${gender}`;
const keywordPoolKey = (keyword) => `pool:keyword:${keyword}`;

function serializeUser(user) {
    return {
        id: user.id,
        keywords: JSON.stringify(user.keywords || []),
        status: user.status,
        partnerId: user.partnerId || '',
        roomId: user.roomId || '',
        myGender: user.myGender || 'Unknown',
        myCountry: user.myCountry || 'ALL',
        prefGender: user.prefGender || 'Both',
        prefCountry: user.prefCountry || 'ALL',
    };
}

function deserializeUser(hash) {
    if (!hash || Object.keys(hash).length === 0) return null;
    return {
        id: hash.id,
        keywords: JSON.parse(hash.keywords || '[]'),
        status: hash.status,
        partnerId: hash.partnerId || null,
        roomId: hash.roomId || null,
        myGender: hash.myGender || 'Unknown',
        myCountry: hash.myCountry || 'ALL',
        prefGender: hash.prefGender || 'Both',
        prefCountry: hash.prefCountry || 'ALL',
    };
}

async function getUser(socketId) {
    const hash = await redis.hgetall(userKey(socketId));
    return deserializeUser(hash);
}

// Every write refreshes the TTL - this is what makes presence self-cleaning.
async function saveUser(socketId, user) {
    const pipeline = redis.pipeline();
    pipeline.hset(userKey(socketId), serializeUser(user));
    pipeline.expire(userKey(socketId), PRESENCE_TTL_SECONDS);
    await pipeline.exec();
}

async function patchUser(socketId, partial) {
    const user = await getUser(socketId);
    if (!user) return null;
    const updated = { ...user, ...partial };
    await saveUser(socketId, updated);
    return updated;
}

async function deleteUser(socketId) {
    await redis.del(userKey(socketId), userPoolsKey(socketId));
    await redis.zrem('online:heartbeats', socketId);
}

async function getRoom(roomId) {
    const hash = await redis.hgetall(roomKey(roomId));
    if (!hash || Object.keys(hash).length === 0) return null;
    return {
        roomId: hash.roomId,
        user1Id: hash.user1Id,
        user2Id: hash.user2Id,
        commonKeywords: JSON.parse(hash.commonKeywords || '[]'),
    };
}

async function saveRoom(room) {
    await redis.hset(roomKey(room.roomId), {
        roomId: room.roomId,
        user1Id: room.user1Id,
        user2Id: room.user2Id,
        commonKeywords: JSON.stringify(room.commonKeywords || []),
    });
}

async function deleteRoom(roomId) {
    await redis.del(roomKey(roomId));
}

// Prunes anyone who hasn't heartbeated within the TTL window before counting,
// so a crashed process's stale entries don't inflate the number forever.
async function getOnlineCount() {
    const staleBefore = Date.now() - PRESENCE_TTL_SECONDS * 1000;
    await redis.zremrangebyscore('online:heartbeats', 0, staleBefore);
    return redis.zcard('online:heartbeats');
}

// ----------------------------------------------------------------------------
// MATCHMAKING HELPERS
// ----------------------------------------------------------------------------

function parseKeywords(keywordInput) {
    if (!keywordInput) return [];
    let keywordArray = [];
    if (typeof keywordInput === 'string') {
        keywordArray = keywordInput
            .split(',')
            .map((k) => k.trim().toLowerCase())
            .filter((k) => k.length > 0 && k.length <= 30);
    } else if (Array.isArray(keywordInput)) {
        keywordArray = keywordInput
            .map((k) => String(k).trim().toLowerCase())
            .filter((k) => k.length > 0 && k.length <= 30);
    }
    return keywordArray.slice(0, 5);
}

function findCommonKeywords(keywords1, keywords2) {
    if (!keywords1 || !keywords2) return [];
    return keywords1.filter((k) => keywords2.includes(k));
}

function isPreferenceMatch(user1, user2) {
    if (!user1 || !user2) return false;
    if (user1.prefGender !== 'Both' && user1.prefGender !== user2.myGender) return false;
    if (user2.prefGender !== 'Both' && user2.prefGender !== user1.myGender) return false;
    if (user1.prefCountry !== 'ALL' && user1.prefCountry !== user2.myCountry) return false;
    if (user2.prefCountry !== 'ALL' && user2.prefCountry !== user1.myCountry) return false;
    return true;
}

function generateRoomId() {
    return `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function eligibleGenderBuckets(prefGender) {
    if (!prefGender || prefGender === 'Both') return GENDERS;
    return [prefGender];
}

// Peeks up to MAX_SCAN_CANDIDATES ids from a waiting-pool list (does not
// remove them - claiming happens separately and atomically), batch-fetches
// their hashes, and opportunistically LREMs any id whose hash has expired
// (ghost cleanup) so dead entries don't accumulate forever.
async function peekCandidates(listKey, excludeId) {
    const ids = await redis.lrange(listKey, 0, MAX_SCAN_CANDIDATES - 1);
    const filteredIds = ids.filter((id) => id !== excludeId);
    if (filteredIds.length === 0) return [];

    const pipeline = redis.pipeline();
    filteredIds.forEach((id) => pipeline.hgetall(userKey(id)));
    const results = await pipeline.exec();

    const candidates = [];
    const ghostIds = [];

    results.forEach(([err, hash], i) => {
        const id = filteredIds[i];
        if (err || !hash || Object.keys(hash).length === 0) {
            ghostIds.push(id);
            return;
        }
        const u = deserializeUser(hash);
        if (u) candidates.push(u);
    });

    if (ghostIds.length > 0) {
        const cleanupPipeline = redis.pipeline();
        ghostIds.forEach((id) => cleanupPipeline.lrem(listKey, 0, id));
        await cleanupPipeline.exec();
    }

    return candidates;
}

async function removeFromList(listKey, id) {
    await redis.lrem(listKey, 0, id);
}

async function addUserToRandomPool(user) {
    const key = randomPoolKey(user.myGender);
    await redis.rpush(key, user.id);
    await redis.sadd(userPoolsKey(user.id), key);
}

async function addUserToKeywordPools(user) {
    const pipeline = redis.pipeline();
    for (const keyword of user.keywords) {
        const key = keywordPoolKey(keyword);
        pipeline.rpush(key, user.id);
        pipeline.sadd(userPoolsKey(user.id), key);
    }
    await pipeline.exec();
}

async function removeFromWaitingPools(socketId) {
    const poolKeys = await redis.smembers(userPoolsKey(socketId));
    if (poolKeys.length === 0) return;
    const pipeline = redis.pipeline();
    for (const key of poolKeys) {
        pipeline.lrem(key, 0, socketId);
    }
    pipeline.del(userPoolsKey(socketId));
    await pipeline.exec();
}

// Pure "find a candidate" - does NOT claim/mutate anything. Claiming is a
// separate, atomic step (see attemptClaimBothSides) so this function is safe
// to call speculatively without side effects.
async function findRandomMatch(user) {
    const buckets = eligibleGenderBuckets(user.prefGender);
    for (const gender of buckets) {
        const key = randomPoolKey(gender);
        const candidates = await peekCandidates(key, user.id);
        for (const candidate of candidates) {
            if (candidate.status === 'searching' && isPreferenceMatch(candidate, user)) {
                return candidate;
            }
        }
    }
    return null;
}

async function findKeywordMatch(user) {
    let bestCandidate = null;
    let bestCommon = [];
    let maxCommon = 0;

    for (const keyword of user.keywords) {
        const key = keywordPoolKey(keyword);
        const candidates = await peekCandidates(key, user.id);
        for (const candidate of candidates) {
            if (candidate.status !== 'searching') continue;
            if (!isPreferenceMatch(candidate, user)) continue;
            const common = findCommonKeywords(user.keywords, candidate.keywords);
            if (common.length > maxCommon) {
                maxCommon = common.length;
                bestCandidate = candidate;
                bestCommon = common;
            }
        }
    }

    return bestCandidate ? { partner: bestCandidate, commonKeywords: bestCommon } : null;
}

// --- THE CORE FIX: atomic two-sided claim, with rollback ---
//
// A found candidate is NOT a guaranteed match until both sides are
// successfully flipped from 'searching' to 'matched'. If either flip fails
// (candidate already taken/dead, or WE got claimed by someone else in the
// same instant), nothing is left in a broken state:
//   - if candidate claim fails -> we never touched anything, just try again
//   - if our own claim fails -> we hand the candidate's claim back so they
//     aren't stranded thinking they're matched to nobody
async function attemptClaimBothSides(selfId, candidateId) {
    const gotCandidate = await redis.claimUser(userKey(candidateId));
    if (!gotCandidate) return false;

    const gotSelf = await redis.claimUser(userKey(selfId));
    if (!gotSelf) {
        // We lost the race for ourselves - give the candidate's slot back.
        await redis.hset(userKey(candidateId), 'status', 'searching');
        return false;
    }

    return true;
}

async function releasePartnerIfStillInRoom(partnerId, roomId) {
    if (!partnerId || !roomId) return false;
    const result = await redis.releaseIfRoomMatches(userKey(partnerId), roomId);
    return result === 1;
}

async function createRoomAndNotify(io, userA, userB, commonKeywords) {
    const roomId = generateRoomId();
    await saveRoom({ roomId, user1Id: userA.id, user2Id: userB.id, commonKeywords });

    // Both sides are already flagged status='matched' by attemptClaimBothSides;
    // this call fills in partnerId/roomId on top of that.
    await patchUser(userA.id, { status: 'matched', partnerId: userB.id, roomId });
    await patchUser(userB.id, { status: 'matched', partnerId: userA.id, roomId });

    io.to(userA.id).emit('matched', {
        roomId,
        partnerId: userB.id,
        commonKeywords,
        isInitiator: true,
    });
    io.to(userB.id).emit('matched', {
        roomId,
        partnerId: userA.id,
        commonKeywords,
        isInitiator: false,
    });

    console.log(`[MATCH SUCCESS] Room ${roomId}: ${userA.id} <-> ${userB.id}`);
}

// ----------------------------------------------------------------------------
// RATE LIMITING (per-process, per-socket)
// ----------------------------------------------------------------------------

const RATE_LIMITS = {
    search: { max: 10, windowMs: 10000 },
    'ice-candidate': { max: 60, windowMs: 5000 },
    'chat-message': { max: 15, windowMs: 10000 },
};

const rateBuckets = new Map();

function isRateLimited(socketId, eventName) {
    const limit = RATE_LIMITS[eventName];
    if (!limit) return false;

    const now = Date.now();
    let socketBuckets = rateBuckets.get(socketId);
    if (!socketBuckets) {
        socketBuckets = {};
        rateBuckets.set(socketId, socketBuckets);
    }

    let bucket = socketBuckets[eventName];
    if (!bucket || now - bucket.windowStart > limit.windowMs) {
        bucket = { count: 0, windowStart: now };
        socketBuckets[eventName] = bucket;
    }

    bucket.count += 1;
    return bucket.count > limit.max;
}

function clearRateBuckets(socketId) {
    rateBuckets.delete(socketId);
}

// ----------------------------------------------------------------------------
// PRESENCE HEARTBEAT (keeps TTLs alive for every socket THIS process owns)
// ----------------------------------------------------------------------------

setInterval(async () => {
    try {
        const sockets = await io.of('/').local.fetchSockets();
        if (sockets.length === 0) return;

        const now = Date.now();
        const pipeline = redis.pipeline();
        for (const s of sockets) {
            pipeline.expire(userKey(s.id), PRESENCE_TTL_SECONDS);
            pipeline.zadd('online:heartbeats', now, s.id);
        }
        await pipeline.exec();
    } catch (err) {
        console.error('[heartbeat error]', err);
    }
}, HEARTBEAT_INTERVAL_MS);

// ----------------------------------------------------------------------------
// SOCKET.IO CONNECTION HANDLING
// ----------------------------------------------------------------------------

io.on('connection', (socket) => {
    console.log(`[CONNECTED] ${socket.id}`);

    // 🚨 FIX: every socket.on(...) listener below is now registered
    // SYNCHRONOUSLY, immediately, before any Redis round trip. Previously
    // this whole callback was `async` and did THREE sequential `await`s
    // (saveUser, zadd, getOnlineCount) before reaching the `socket.on('search', ...)`
    // line. Against a real network Redis (not localhost), that's tens to
    // hundreds of milliseconds during which the socket is connected but NO
    // listeners exist yet. Any event the client fires in that window -
    // e.g. a client that calls socket.emit('search', ...) the instant
    // 'connect' fires, which is exactly what load-tester.js does - is
    // silently dropped by Socket.IO: no listener means no error, no log,
    // nothing. That is the entire bug behind "zero matches, zero errors."
    //
    // The actual Redis writes (saveUser/heartbeat/online-count) are now
    // fired in a separate async IIFE AFTER listeners are attached, so they
    // can no longer race against incoming events.

    let searchTimeoutHandle = null;

    socket.on('search', async (searchParams) => {
        try {
            if (isRateLimited(socket.id, 'search')) return;

            let user = await getUser(socket.id);
            if (!user) {
                // Self-heal: the connect-time Redis write (see the async init
                // IIFE below) may not have finished yet, especially against a
                // real network Redis instance. Create the record now instead
                // of silently dropping this search - this is what used to
                // cause "connects fine, search never does anything, zero
                // errors" under load.
                user = {
                    id: socket.id,
                    keywords: [],
                    status: 'idle',
                    partnerId: null,
                    roomId: null,
                    myGender: 'Unknown',
                    myCountry: 'ALL',
                    prefGender: 'Both',
                    prefCountry: 'ALL',
                };
                await saveUser(socket.id, user);
            }

            if (searchTimeoutHandle) {
                clearTimeout(searchTimeoutHandle);
                searchTimeoutHandle = null;
            }

            // Leave any existing room first. Uses the atomic, compare-and-swap
            // release so we never clobber a partner who has already moved on.
            if (user.roomId) {
                const oldRoomId = user.roomId;
                const partnerId = user.partnerId;

                if (partnerId) {
                    io.to(partnerId).emit('stranger-disconnected');
                    await releasePartnerIfStillInRoom(partnerId, oldRoomId);
                }
                await deleteRoom(oldRoomId);
            }

            await removeFromWaitingPools(socket.id);

            let keywords = [];
            let myGender = user.myGender;
            let myCountry = user.myCountry;
            let prefGender = user.prefGender;
            let prefCountry = user.prefCountry;

            if (searchParams && typeof searchParams === 'object' && !Array.isArray(searchParams)) {
                keywords = searchParams.keywords || [];
                myGender = searchParams.myGender ?? myGender;
                myCountry = searchParams.myCountry ?? myCountry;
                prefGender = searchParams.prefGender ?? prefGender;
                prefCountry = searchParams.prefCountry ?? prefCountry;
            } else {
                keywords = searchParams;
            }

            const parsedKeywords = parseKeywords(keywords);

            // Explicitly clear roomId/partnerId here - do NOT rely on stale
            // values being overwritten later. This was the source of the
            // "leftover partner pointer" bug.
            const updatedUser = await patchUser(socket.id, {
                keywords: parsedKeywords,
                status: 'searching',
                myGender,
                myCountry,
                prefGender,
                prefCountry,
                partnerId: '',
                roomId: '',
            });

            socket.emit('searching');

            if (parsedKeywords.length > 0) {
                const keywordCandidate = await findKeywordMatch(updatedUser);

                if (keywordCandidate) {
                    const { partner, commonKeywords } = keywordCandidate;
                    const locked = await attemptClaimBothSides(socket.id, partner.id);
                    if (locked) {
                        await removeFromWaitingPools(partner.id);
                        await createRoomAndNotify(io, updatedUser, partner, commonKeywords);
                        return;
                    }
                    // Candidate was already taken (or dead) - fall through to enqueue.
                }

                await addUserToKeywordPools(updatedUser);

                searchTimeoutHandle = setTimeout(async () => {
                    try {
                        const currentUser = await getUser(socket.id);
                        if (!currentUser || currentUser.status !== 'searching') return;

                        console.log(`[TIMEOUT] ${socket.id} falling back to random match`);
                        await removeFromWaitingPools(socket.id);

                        const fallbackCandidate = await findRandomMatch(currentUser);
                        if (fallbackCandidate) {
                            const locked = await attemptClaimBothSides(
                                socket.id,
                                fallbackCandidate.id,
                            );
                            if (locked) {
                                await removeFromWaitingPools(fallbackCandidate.id);
                                await createRoomAndNotify(io, currentUser, fallbackCandidate, []);
                                return;
                            }
                        }
                        await addUserToRandomPool(currentUser);
                    } catch (err) {
                        console.error('[searchTimeout error]', err);
                    }
                }, 60000);

                return;
            }

            const randomCandidate = await findRandomMatch(updatedUser);
            if (randomCandidate) {
                const locked = await attemptClaimBothSides(socket.id, randomCandidate.id);
                if (locked) {
                    await removeFromWaitingPools(randomCandidate.id);
                    await createRoomAndNotify(io, updatedUser, randomCandidate, []);
                    return;
                }
            }
            await addUserToRandomPool(updatedUser);
        } catch (err) {
            console.error('[search handler error]', err);
        }
    });

    socket.on('offer', async (data) => {
        const user = await getUser(socket.id);
        if (user && user.partnerId) {
            io.to(user.partnerId).emit('offer', { offer: data.offer, roomId: data.roomId });
        }
    });

    socket.on('answer', async (data) => {
        const user = await getUser(socket.id);
        if (user && user.partnerId) {
            io.to(user.partnerId).emit('answer', { answer: data.answer, roomId: data.roomId });
        }
    });

    socket.on('ice-candidate', async (data) => {
        if (isRateLimited(socket.id, 'ice-candidate')) return;
        const user = await getUser(socket.id);
        if (user && user.partnerId) {
            io.to(user.partnerId).emit('ice-candidate', {
                candidate: data.candidate,
                roomId: data.roomId,
            });
        }
    });

    socket.on('chat-message', async (message) => {
        if (isRateLimited(socket.id, 'chat-message')) return;
        const user = await getUser(socket.id);
        if (user && user.partnerId && typeof message === 'string' && message.trim()) {
            io.to(user.partnerId).emit('chat-message', { message: message.trim() });
        }
    });

    socket.on('leave-chat', async (data, callback) => {
        try {
            console.log(`User ${socket.id} requested to stop everything.`);

            const user = await getUser(socket.id);
            if (!user) return;

            if (searchTimeoutHandle) {
                clearTimeout(searchTimeoutHandle);
                searchTimeoutHandle = null;
            }

            await removeFromWaitingPools(socket.id);

            const targetRoomId = (data && data.roomId) || user.roomId;
            const targetPartnerId = (data && data.partnerId) || user.partnerId;

            if (targetPartnerId) {
                io.to(targetPartnerId).emit('stranger-disconnected');
                await releasePartnerIfStillInRoom(targetPartnerId, targetRoomId);
            }

            if (targetRoomId) {
                await deleteRoom(targetRoomId);
            }

            await patchUser(socket.id, { status: 'idle', partnerId: '', roomId: '' });

            if (typeof callback === 'function') {
                callback({ ok: true, notifiedPartner: !!targetPartnerId });
            }
        } catch (err) {
            console.error('[leave-chat handler error]', err);
            if (typeof callback === 'function') callback({ ok: false });
        }
    });

    socket.on('disconnect', async () => {
        try {
            if (searchTimeoutHandle) {
                clearTimeout(searchTimeoutHandle);
                searchTimeoutHandle = null;
            }

            const user = await getUser(socket.id);
            if (user) {
                if (user.roomId && user.partnerId) {
                    io.to(user.partnerId).emit('stranger-disconnected');
                    await releasePartnerIfStillInRoom(user.partnerId, user.roomId);
                    await deleteRoom(user.roomId);
                }
                await removeFromWaitingPools(socket.id);
                await deleteUser(socket.id);
            }

            clearRateBuckets(socket.id);

            const onlineCount = await getOnlineCount();
            io.emit('online-count', { count: onlineCount });
            console.log(`[DISCONNECTED] ${socket.id}`);
        } catch (err) {
            console.error('[disconnect handler error]', err);
        }
    });

    // Deferred, non-blocking init - runs AFTER every listener above is
    // already attached, so it can never race an incoming event. If 'search'
    // already self-healed a user record in the meantime, we don't clobber it.
    (async () => {
        try {
            const existing = await getUser(socket.id);
            if (!existing) {
                await saveUser(socket.id, {
                    id: socket.id,
                    keywords: [],
                    status: 'idle',
                    partnerId: null,
                    roomId: null,
                    myGender: 'Unknown',
                    myCountry: 'ALL',
                    prefGender: 'Both',
                    prefCountry: 'ALL',
                });
            }
            await redis.zadd('online:heartbeats', Date.now(), socket.id);
            const onlineCount = await getOnlineCount();
            io.emit('online-count', { count: onlineCount });
        } catch (err) {
            console.error('[connection init error]', err);
        }
    })();
});

server.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT} (pid ${process.pid}, env ${NODE_ENV})`);
});
