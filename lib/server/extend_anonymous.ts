/**
 * 外挂聊天机器人的匿名用户管理
 * 为每个tenant创建/获取匿名用户和profile
 */
import { eq, and } from "drizzle-orm";

import db from "./db";
import * as schema from "./db/schema";

/**
 * 为tenant获取或创建匿名用户和profile
 * 每个tenant有一个专用的匿名用户用于外挂聊天
 */
export async function getOrCreateAnonymousProfile(tenantId: string) {
  // 查找该tenant的匿名用户
  const existingProfiles = await db
    .select({
      userId: schema.profiles.userId,
      profileId: schema.profiles.id,
      user: schema.users,
    })
    .from(schema.profiles)
    .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
    .where(and(eq(schema.profiles.tenantId, tenantId), eq(schema.users.isAnonymous, true)))
    .limit(1);

  if (existingProfiles.length > 0) {
    return {
      userId: existingProfiles[0].userId,
      profileId: existingProfiles[0].profileId,
    };
  }

  // 创建新的匿名用户
  const [newUser] = await db
    .insert(schema.users)
    .values({
      isAnonymous: true,
      name: "Anonymous Widget User",
      emailVerified: false,
    })
    .returning();

  // 为该用户创建profile
  const [newProfile] = await db
    .insert(schema.profiles)
    .values({
      userId: newUser.id,
      tenantId: tenantId,
      role: "guest",
    })
    .returning();

  return {
    userId: newUser.id,
    profileId: newProfile.id,
  };
}

/**
 * 为匿名用户创建对话
 */
export async function createAnonymousConversation(tenantId: string, title: string = "Widget Conversation") {
  const { profileId } = await getOrCreateAnonymousProfile(tenantId);

  const [conversation] = await db
    .insert(schema.conversations)
    .values({
      tenantId,
      profileId,
      title,
    })
    .returning();

  return conversation;
}
