// Per-test setup runs before every test file. Set env to known dev values
// before any module reads them.
process.env.NODE_ENV ??= 'development'
process.env.IP_HASH_SECRET ??= 'test-ip-hash-secret'
// Keep upload + monthly caps high so unrelated tests don't trip them.
process.env.MAX_UPLOAD_BYTES ??= String(100 * 1024 * 1024)
process.env.MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES ??= String(250 * 1024 * 1024 * 1024)
