import AppLayout from "@/components/layout/AppLayout";
import { PageSection, PageSectionTitle, PageSectionContent } from "@/components/ui/page-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { teamsConfig } from "@/data/teamsConfig";
import { coachesConfig } from "@/data/coachesConfig";
import { studentsConfig } from "@/data/studentsConfig";
import { reportsConfig, reportTypeOptions } from "@/data/reportsConfig";
import { coursesConfig, scheduleEventsConfig } from "@/data/scheduleConfig";
import { Users, UserCog, GraduationCap, FileText, Calendar, Database } from "lucide-react";

const DataConfig = () => {
  const stats = [
    { label: "球隊", count: teamsConfig.length, icon: Users },
    { label: "教練", count: coachesConfig.length, icon: UserCog },
    { label: "學員", count: studentsConfig.length, icon: GraduationCap },
    { label: "報告", count: reportsConfig.length, icon: FileText },
    { label: "課程", count: coursesConfig.length, icon: Calendar },
    { label: "課表事件", count: Object.values(scheduleEventsConfig).flat().length, icon: Database },
  ];

  return (
    <AppLayout title="資料配置總覽">
      <PageSection>
        <PageSectionTitle>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            資料配置總覽
          </div>
        </PageSectionTitle>
        <PageSectionContent>
          <p className="text-sm text-muted-foreground mb-6">
            此頁面為開發者工具，用於快速檢視系統中所有配置檔案的資料內容。
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Config Tabs */}
          <Tabs defaultValue="teams" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="teams">球隊</TabsTrigger>
              <TabsTrigger value="coaches">教練</TabsTrigger>
              <TabsTrigger value="students">學員</TabsTrigger>
              <TabsTrigger value="reports">報告</TabsTrigger>
              <TabsTrigger value="schedule">課表</TabsTrigger>
            </TabsList>

            {/* Teams Config */}
            <TabsContent value="teams">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">teamsConfig.ts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>名稱</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamsConfig.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-mono text-xs">{team.id}</TableCell>
                          <TableCell>{team.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Coaches Config */}
            <TabsContent value="coaches">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">coachesConfig.ts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>名稱</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>負責球隊</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coachesConfig.map((coach) => (
                        <TableRow key={coach.id}>
                          <TableCell className="font-mono text-xs">{coach.id}</TableCell>
                          <TableCell>{coach.name}</TableCell>
                          <TableCell className="text-xs">{coach.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{coach.roleId}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {coach.teams.map((teamId) => (
                                <Badge key={teamId} variant="secondary" className="text-xs">
                                  {teamId}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Config */}
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">studentsConfig.ts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>名稱</TableHead>
                        <TableHead>球隊</TableHead>
                        <TableHead>位置</TableHead>
                        <TableHead>負責教練</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsConfig.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-xs">{student.id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student.teamId}</Badge>
                          </TableCell>
                          <TableCell>{student.position}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {student.responsibleCoachIds.map((coachId) => (
                                <Badge key={coachId} variant="outline" className="text-xs">
                                  {coachId}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{student.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Config */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">reportsConfig.ts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">報告類型選項：</p>
                    <div className="flex gap-2">
                      {reportTypeOptions.map((option) => (
                        <Badge key={option.value} variant="outline">
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>日期</TableHead>
                        <TableHead>學員 ID</TableHead>
                        <TableHead>類型</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsConfig.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-xs">{report.id}</TableCell>
                          <TableCell>{report.date}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{report.studentId}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.type}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Config */}
            <TabsContent value="schedule">
              <div className="space-y-4">
                {/* Courses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">coursesConfig (課程列表)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {coursesConfig.map((course) => (
                        <Badge key={course.id} variant="secondary">
                          <span className="font-mono text-xs mr-1">{course.id}:</span>
                          {course.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">scheduleEventsConfig (課表事件)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {Object.entries(scheduleEventsConfig).map(([day, events]) => (
                        <AccordionItem key={day} value={day}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <span>第 {day} 天</span>
                              <Badge variant="secondary">{events.length} 事件</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>課程 ID</TableHead>
                                  <TableHead>學員 ID</TableHead>
                                  <TableHead>標記</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {events.map((event, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-mono text-xs">{event.courseId}</TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">{event.studentId}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      {event.highlight && (
                                        <Badge variant="default">Highlight</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </PageSectionContent>
      </PageSection>
    </AppLayout>
  );
};

export default DataConfig;
