"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql, getClientIp } from "./db";
import type { Post, PaginationResult } from "./types";

// 게시물 생성
export async function createPost(data: { title: string; content: string }) {
  const ip = getClientIp();

  try {
    await sql`
      INSERT INTO posts (title, content, ip)
      VALUES (${data.title}, ${data.content}, ${ip})
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("게시물 생성 오류:", error);
    return {
      success: false,
      error: "게시물을 저장하는 중 오류가 발생했습니다.",
    };
  }
}

// 게시물 목록 조회 (페이지네이션)
export async function getPosts(page = 1): Promise<PaginationResult<Post>> {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  try {
    // 전체 게시물 수 조회
    const countResult = await sql`SELECT COUNT(*) FROM posts`;
    const totalCount = Number.parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / pageSize);

    // 페이지에 해당하는 게시물 조회
    const posts = await sql<Post[]>`
      SELECT id, title, content, ip, created_at
      FROM posts
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    return {
      data: posts,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("게시물 조회 오류:", error);
    return {
      data: [],
      totalPages: 0,
      currentPage: page,
    };
  }
}

// 관리자 키 확인
export async function checkAdminKey(formData: FormData): Promise<boolean> {
  const adminKey = formData.get("adminKey") as string;

  if (!adminKey) return false;

  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM admins
      WHERE admin_key = ${adminKey}
    `;

    const isAdmin = Number.parseInt(result[0].count) > 0;

    if (isAdmin) {
      // 관리자 인증 성공 시 쿠키 설정 (24시간 유효)
      const cookie = await cookies();
      cookie.set("admin_auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    }

    return isAdmin;
  } catch (error) {
    console.error("관리자 키 확인 오류:", error);
    return false;
  }
}

// 관리자 상태 확인
export async function getAdminStatus(): Promise<boolean> {
  const cookie = await cookies();
  const adminCookie = cookie.get("admin_auth");
  return adminCookie?.value === "true";
}

// 관리자 로그아웃
export async function logoutAdmin() {
  const cookie = await cookies();
  cookie.delete("admin_auth");
  revalidatePath("/");
  redirect("/");
}
