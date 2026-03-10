import { getUsers } from "../actions";
import StatsClient from "./stats-client";

export const revalidate = 0;

export default async function StatsPage() {
  const users = await getUsers();
  return <StatsClient users={users} />;
}
