const kv = await Deno.openKv();
const today = new Date();
const dateKey = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(
  today.getDate()
).padStart(2, "0")}-${today.getFullYear()}`;
await kv.delete(["gameData", dateKey]);
console.log("Deleted today's game data:", dateKey);
