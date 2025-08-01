"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 사용자 타입 정의
export type User = {
  id: number;
  name: string;
  join_date: string | null;
  last_meetup_date: string | null;
  is_regular: "신입" | "기존";
  meetup_count: number;
  total_meetup_count: number;
  meetup_make_count: number;
};

// 사용자 생성
export async function createUser(data: {
  name: string;
  join_date?: string;
  last_meetup_date?: string;
  is_regular: "신입" | "기존";
  meetup_count: number;
  total_meetup_count: number;
  meetup_make_count: number;
}) {
  try {
    await sql`
      INSERT INTO users (
        name, 
        join_date, 
        last_meetup_date, 
        is_regular, 
        meetup_count, 
        total_meetup_count,
        meetup_make_count
      )
      VALUES (
        ${data.name}, 
        ${data.join_date || null}, 
        ${data.last_meetup_date || null}, 
        ${data.is_regular}, 
        ${data.meetup_count}, 
        ${data.total_meetup_count},
        ${data.meetup_make_count}
      )
    `;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("사용자 생성 오류:", error);
    return {
      success: false,
      error: "사용자를 저장하는 중 오류가 발생했습니다.",
    };
  }
}

// 모든 사용자 조회
export async function getUsers(
  sortKey: "join_date" | "last_meetup_date" | "name" = "join_date",
  sortOrder: "asc" | "desc" = "desc",
  searchTerm: string = ""
): Promise<User[]> {
  try {
    const validSortKeys = ["join_date", "last_meetup_date", "name"];
    const validSortOrders = ["asc", "desc"];

    const selectedSortKey = validSortKeys.includes(sortKey)
      ? sortKey
      : "join_date";
    const selectedSortOrder = validSortOrders.includes(sortOrder)
      ? sortOrder.toUpperCase()
      : "DESC";

    let query;
    let params: any[] = [];

    if (searchTerm) {
      query = `
        SELECT * FROM users
        WHERE name ILIKE $1
        ORDER BY ${selectedSortKey} ${selectedSortOrder}
      `;
      params.push(`%${searchTerm}%`);
    } else {
      query = `
        SELECT * FROM users
        ORDER BY ${selectedSortKey} ${selectedSortOrder}
      `;
    }

    const users = (await sql.query(query, params)) as User[];
    return users;
  } catch (error) {
    console.error("사용자 조회 오류:", error);
    return [];
  }
}

export async function revalidateUsers() {
  revalidatePath("/users"); // 캐시 무효화
}

// 이름으로 사용자 검색
export async function searchUsersByName(searchTerm: string): Promise<User[]> {
  try {
    if (!searchTerm.trim()) {
      return await getUsers();
    }

    const users = await sql`
      SELECT * FROM users 
      WHERE name ILIKE ${`%${searchTerm}%`}
      ORDER BY id DESC
    `;
    return users as unknown as User[];
  } catch (error) {
    console.error("사용자 검색 오류:", error);
    return [];
  }
}

// 특정 사용자 조회
export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await sql`
      SELECT * FROM users 
      WHERE id = ${id}
    `;
    const userArray = users as unknown as User[];
    return userArray[0] || null;
  } catch (error) {
    console.error("사용자 조회 오류:", error);
    return null;
  }
}

// 사용자 업데이트
export async function updateUser(
  id: number,
  data: {
    name: string;
    join_date?: string;
    last_meetup_date?: string;
    is_regular: "신입" | "기존";
    meetup_count: number;
    total_meetup_count: number;
    meetup_make_count: number;
  }
) {
  try {
    await sql`
      UPDATE users 
      SET 
        name = ${data.name},
        join_date = ${data.join_date || null},
        last_meetup_date = ${data.last_meetup_date || null},
        is_regular = ${data.is_regular},
        meetup_count = ${data.meetup_count},
        total_meetup_count = ${data.total_meetup_count},
        meetup_make_count = ${data.meetup_make_count}
      WHERE id = ${id}
    `;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("사용자 업데이트 오류:", error);
    return {
      success: false,
      error: "사용자 정보를 업데이트하는 중 오류가 발생했습니다.",
    };
  }
}

// 사용자 삭제
export async function deleteUser(id: number) {
  try {
    await sql`
      DELETE FROM users 
      WHERE id = ${id}
    `;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("사용자 삭제 오류:", error);
    return {
      success: false,
      error: "사용자를 삭제하는 중 오류가 발생했습니다.",
    };
  }
}

// 사용자 벙 참여 횟수 증가
export async function incrementMeetupCount(id: number) {
  try {
    await sql`
      UPDATE users 
      SET 
        meetup_count = meetup_count + 1,
        total_meetup_count = total_meetup_count + 1,
        last_meetup_date = CURRENT_DATE
      WHERE id = ${id}
    `;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("사용자 벙 참여 횟수 업데이트 오류:", error);
    return {
      success: false,
      error: "사용자 벙 참여 횟수를 업데이트하는 중 오류가 발생했습니다.",
    };
  }
}

export async function increementMeetupMakeCount(id: number) {
  try {
    await sql`
      UPDATE users 
      SET 
        meetup_make_count = meetup_make_count + 1
      WHERE id = ${id}
    `;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("벙주 횟수 업데이트 오류:", error);
    return {
      success: false,
      error: "벙주 횟수를 업데이트하는 중 오류가 발생했습니다.",
    };
  }
}

// 모든 사용자 벙 참여 횟수 초기화 (월 초기화)
export async function resetAllMeetupCounts() {
  try {
    await sql`
  UPDATE users 
  SET meetup_count = 0, meetup_make_count = 0
`;

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("사용자 벙 참여 횟수 초기화 오류:", error);
    return {
      success: false,
      error: "사용자 벙 참여 횟수를 초기화하는 중 오류가 발생했습니다.",
    };
  }
}
