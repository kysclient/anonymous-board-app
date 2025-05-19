"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql, getClientIp } from "./db";
import type { Post, PaginationResult, SearchParams, Survey } from "./types";

// 게시물 생성
export async function createPost(data: { title: string; content: string }) {
  const ip = await getClientIp();
  console.log("Client IP:", ip); // 디버깅용 로그 추가

  try {
    // 서버 시간을 사용하여 게시물 생성 (UTC 기준)
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

// 게시물 목록 조회 (페이지네이션 + 검색)
export async function getPosts(
  page = 1,
  searchParams?: SearchParams
): Promise<PaginationResult<Post>> {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  try {
    let countQuery = sql`SELECT COUNT(*) FROM posts`;
    let postsQuery = sql`
      SELECT id, title, content, ip, created_at
      FROM posts
    `;

    // 검색 조건이 있는 경우 WHERE 절 추가
    if (searchParams?.searchQuery && searchParams?.searchType) {
      const searchValue = `%${searchParams.searchQuery}%`; // LIKE 검색을 위한 와일드카드

      if (searchParams.searchType === "title") {
        countQuery = sql`SELECT COUNT(*) FROM posts WHERE title ILIKE ${searchValue}`;
        postsQuery = sql`
          SELECT id, title, content, ip, created_at
          FROM posts
          WHERE title ILIKE ${searchValue}
        `;
      } else if (searchParams.searchType === "content") {
        countQuery = sql`SELECT COUNT(*) FROM posts WHERE content ILIKE ${searchValue}`;
        postsQuery = sql`
          SELECT id, title, content, ip, created_at
          FROM posts
          WHERE content ILIKE ${searchValue}
        `;
      } else if (searchParams.searchType === "ip") {
        countQuery = sql`SELECT COUNT(*) FROM posts WHERE ip ILIKE ${searchValue}`;
        postsQuery = sql`
          SELECT id, title, content, ip, created_at
          FROM posts
          WHERE ip ILIKE ${searchValue}
        `;
      }
    }

    // ORDER BY와 LIMIT 추가
    postsQuery = sql`${postsQuery} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;

    // 쿼리 실행
    const countResult = await countQuery;
    const totalCount = Number.parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / pageSize);

    const posts = await postsQuery;

    return {
      data: posts as Post[],
      totalPages,
      currentPage: page,
      totalCount,
      searchParams,
    };
  } catch (error) {
    console.error("게시물 조회 오류:", error);
    return {
      data: [],
      totalPages: 0,
      currentPage: page,
      totalCount: 0,
      searchParams,
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

export async function createSurvey(formData: FormData) {
  const ip = await getClientIp();
  const meetingDate = formData.get("meetingDate") as string;
  const meetingType = formData.get("meetingType") as string;

  try {
    await sql`
      INSERT INTO surveys (meeting_date, meeting_type, ip)
      VALUES (${meetingDate}, ${meetingType}, ${ip})
    `;

    revalidatePath("/survey");
    return { success: true };
  } catch (error) {
    console.error("설문 생성 오류:", error);
    return {
      success: false,
      error: "설문을 저장하는 중 오류가 발생했습니다.",
    };
  }
}

export async function getSurveys(): Promise<Survey[]> {
  try {
    const surveys = await sql`
      SELECT id, meeting_date, meeting_type, ip, created_at
      FROM surveys
      ORDER BY created_at DESC
    `;
    return surveys as Survey[];
  } catch (error) {
    console.error("설문 조회 오류:", error);
    return [];
  }
}
