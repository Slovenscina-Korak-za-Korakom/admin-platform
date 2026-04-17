import Image from "next/image";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {IconLoader2} from "@tabler/icons-react";
import {Suspense} from "react";
import CoursesList from "@/app/(protected)/course-management/_components/courses-list";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

export default function CourseManagementPage() {
  const available = process.env.COURSES_AVAILABLE === "true"

  if (!available) {
    return (
      <div className="flex flex-col p-6 min-h-[calc(100vh-var(--header-height))]">
        {/* Main Content - Two Column Layout */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Side - Booking Card */}
            <div className="w-full">
              <div className="bg-white p-6 dark:bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
                {/* Image Section */}
                <div
                  className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-500 via-purple-400 to-blue-500 rounded-3xl">
                  {/* Background Image */}
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                    alt="Modern workspace with laptop and learning materials"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Gradient overlay for depth and color blend */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-purple-900/30 to-transparent"/>
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-blue-500/30 to-transparent"/>

                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-white text-gray-900 border-0 shadow-sm font-medium px-3 py-1">
                      Coming Soon
                    </Badge>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="h-20 w-full bg-background"/>
              </div>
            </div>

            {/* Right Side - Status Information */}
            <div className="w-full flex flex-col justify-center space-y-6 lg:pt-16">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Course management is coming soon
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                  We&apos;re working hard to build a comprehensive course
                  management system. Once ready, you&apos;ll be able to create,
                  organize, and manage all your courses in one place. We&apos;ll
                  notify you as soon as it&apos;s available.
                </p>
              </div>

              <div>
                <Button
                  size="lg"
                  asChild
                >
                  <Link href={"/dashboard"}>
                    Got it
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  }

  return (
    <div className="flex flex-col gap-6 w-full p-6">
      <h1 className="text-4xl leading-none font-bold tracking-tighter">
        My Courses
      </h1>
      <Tabs defaultValue="active">
        <TabsList variant="line">
          <TabsTrigger value={"all"}>All</TabsTrigger>
          <TabsTrigger value={"active"}>Active</TabsTrigger>
          <TabsTrigger value={"upcoming"}>Upcoming</TabsTrigger>
          <TabsTrigger value={"deleted"}>Deleted</TabsTrigger>
        </TabsList>
        <TabsContent value={"all"}>
          ALL
        </TabsContent>
        <TabsContent value={"active"}>
          ACTIVE
        </TabsContent>
        <TabsContent value={"upcoming"}>
          UPCOMING
        </TabsContent>
        <TabsContent value={"deleted"}>
          DELETED
        </TabsContent>
      </Tabs>

      {/* Courses Grid */}
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Courses
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            All available courses on the platform
          </p>
        </div>
        <div className="p-6">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-40">
                <IconLoader2 className="h-7 w-7 animate-spin text-indigo-500"/>
              </div>
            }
          >
            <CoursesList/>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
