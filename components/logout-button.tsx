"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button className="ghost-button" onClick={() => signOut({ callbackUrl: "/login" })} type="button">
      Đăng xuất
    </button>
  );
}
