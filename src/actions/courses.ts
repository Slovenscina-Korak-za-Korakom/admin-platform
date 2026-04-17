"use server";
import db from "@/db";
import {coursesTable, sectionsTable, videosTable} from "@/db/schema";
import {auth} from "@clerk/nextjs/server";
import {eq} from "drizzle-orm";

type CourseInput = {
  title: string;
  description?: string;
  thumbnail?: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
};

type SectionInput = {
  title: string;
  description?: string;
};

type VideoInput = {
  title: string;
  description?: string;
  videoLink: string;
  duration: number;
};

// ── Courses ──────────────────────────────────────────────────────────────────

export const getCourses = async () => {
  try {
    return await db.query.coursesTable.findMany({
      with: {
        sections: {
          with: { videos: true },
        },
      },
      orderBy: (c, {asc}) => [asc(c.order)],
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getCourseById = async (id: number) => {
  try {
    return await db.query.coursesTable.findFirst({
      where: eq(coursesTable.id, id),
      with: {
        sections: {
          orderBy: (s, {asc}) => [asc(s.order)],
          with: {
            videos: {
              orderBy: (v, {asc}) => [asc(v.order)],
            },
          },
        },
      },
    });
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const addCourse = async (values: CourseInput) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    const rows = await db.select({order: coursesTable.order}).from(coursesTable).orderBy(coursesTable.order);
    const maxOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.order)) : -1;

    await db.insert(coursesTable).values({
      title: values.title,
      description: values.description ?? null,
      thumbnail: values.thumbnail || "https://www.slovenscinakzk.com/meta-image-link.jpg",
      level: values.level,
      order: maxOrder + 1,
    });
    return {message: "Course created", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error creating course", success: false};
  }
};

export const updateCourse = async (id: number, values: CourseInput) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    await db.update(coursesTable).set({
      title: values.title,
      description: values.description ?? null,
      thumbnail: values.thumbnail || "https://www.slovenscinakzk.com/meta-image-link.jpg",
      level: values.level,
    }).where(eq(coursesTable.id, id));
    return {message: "Course updated", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error updating course", success: false};
  }
};

export const deleteCourse = async (id: number) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    const sections = await db.select({id: sectionsTable.id}).from(sectionsTable).where(eq(sectionsTable.courseId, id));
    for (const section of sections) {
      await db.delete(videosTable).where(eq(videosTable.sectionId, section.id));
    }
    await db.delete(sectionsTable).where(eq(sectionsTable.courseId, id));
    await db.delete(coursesTable).where(eq(coursesTable.id, id));
    return {message: "Course deleted", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error deleting course", success: false};
  }
};

// ── Sections ─────────────────────────────────────────────────────────────────

export const addSection = async (courseId: number, values: SectionInput) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    const rows = await db.select({order: sectionsTable.order}).from(sectionsTable).where(eq(sectionsTable.courseId, courseId));
    const maxOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.order)) : -1;

    await db.insert(sectionsTable).values({
      title: values.title,
      description: values.description ?? null,
      courseId,
      order: maxOrder + 1,
    });
    return {message: "Section added", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error adding section", success: false};
  }
};

export const updateSection = async (id: number, values: SectionInput) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    await db.update(sectionsTable).set({
      title: values.title,
      description: values.description ?? null,
    }).where(eq(sectionsTable.id, id));
    return {message: "Section updated", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error updating section", success: false};
  }
};

export const deleteSection = async (id: number) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    await db.delete(videosTable).where(eq(videosTable.sectionId, id));
    await db.delete(sectionsTable).where(eq(sectionsTable.id, id));
    return {message: "Section deleted", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error deleting section", success: false};
  }
};

// ── Videos ───────────────────────────────────────────────────────────────────

export const addVideo = async (sectionId: number, values: VideoInput) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    const rows = await db.select({order: videosTable.order}).from(videosTable).where(eq(videosTable.sectionId, sectionId));
    const maxOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.order)) : -1;

    await db.insert(videosTable).values({
      title: values.title,
      description: values.description ?? null,
      videoLink: values.videoLink,
      duration: values.duration,
      sectionId,
      order: maxOrder + 1,
    });
    return {message: "Video added", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error adding video", success: false};
  }
};

export const updateVideo = async (id: number, values: VideoInput) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    await db.update(videosTable).set({
      title: values.title,
      description: values.description ?? null,
      videoLink: values.videoLink,
      duration: values.duration,
    }).where(eq(videosTable.id, id));
    return {message: "Video updated", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error updating video", success: false};
  }
};

export const deleteVideo = async (id: number) => {
  const {userId} = await auth();
  if (!userId) return {message: "Unauthorized", success: false};

  try {
    await db.delete(videosTable).where(eq(videosTable.id, id));
    return {message: "Video deleted", success: true};
  } catch (error) {
    console.error(error);
    return {message: "Error deleting video", success: false};
  }
};
