// Matched against account usernames, then keyed by ID to survive display-name changes.
const avatarFiles: Readonly<Record<string, string>> = {
  "6a86cfe84662d3c913dc37ba": "Ninhden.jpg",
  "6a86ded3a87956f2653e3666": "Dai.jpg",
  "6a86cfb14662d3c913dc37b6": "Doan.jpg",
  "6a86cffe4662d3c913dc37bc": "Hieu.jpg",
  "6a86cfdd4662d3c913dc37b9": "Luong.jpg",
  "6a86d8c422da880bcebb53f4": "Manh.jpg",
  "6a86cfce4662d3c913dc37b8": "Minh.jpg"
};

export function getMemberAvatarSrc(userId: string): string | null {
  if (!Object.prototype.hasOwnProperty.call(avatarFiles, userId)) return null;
  return `/avatars/${encodeURIComponent(avatarFiles[userId])}`;
}
