import assert from "node:assert/strict";
import { getMemberAvatarSrc } from "../lib/member-avatar";

assert.equal(getMemberAvatarSrc("6a86cfce4662d3c913dc37b8"), "/avatars/Minh.jpg");
assert.equal(getMemberAvatarSrc("6a86debba87956f2653e3664"), null);
assert.equal(getMemberAvatarSrc("6a86cffe4662d3c913dc37bc"), "/avatars/Hieu.jpg");
assert.equal(getMemberAvatarSrc("6a86cfe84662d3c913dc37ba"), "/avatars/Ninhden.jpg");
for (const id of ["", "unknown", "constructor", "toString", "__proto__"]) {
  assert.equal(getMemberAvatarSrc(id), null);
}
console.log("Member avatar mapping tests passed");
