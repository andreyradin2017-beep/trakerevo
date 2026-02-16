console.log("NODE_SPAWN_TEST_SUCCESS");
const { exec } = require("child_process");
exec("echo FILE_REDIRECT_WORKS > spawn_done.txt", (err) => {
  if (err) console.error(err);
});
