import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Eye,
  MessageCircle,
  Award,
  TrendingUp
} from "lucide-react";

const MyReports = () => {
  // Mock user reports data
  const userReports = [
    {
      id: "REP-001",
      title: "Broken streetlight on Oak Avenue",
      category: "Streetlight",
      location: "Oak Ave & 3rd Street",
      status: "resolved",
      progress: 100,
      submittedDate: "2024-01-15",
      lastUpdate: "2024-01-18",
      description: "Streetlight has been out for several days, creating safety concerns for pedestrians.",
      departmentResponse: "Issue has been resolved. New LED streetlight installed.",
      estimatedCompletion: "Completed",
      priority: "medium"
    },
    {
      id: "REP-002", 
      title: "Large pothole causing vehicle damage",
      category: "Pothole",
      location: "Main Street near Downtown",
      status: "in-progress",
      progress: 65,
      submittedDate: "2024-01-20",
      lastUpdate: "2024-01-22",
      description: "Deep pothole is causing damage to vehicles and creating a safety hazard.",
      departmentResponse: "Work order assigned to road maintenance crew. Repair scheduled for this week.",
      estimatedCompletion: "January 25, 2024",
      priority: "high"
    },
    {
      id: "REP-003",
      title: "Overflowing garbage bins at Central Park",
      category: "Garbage",
      location: "Central Park, Main Entrance",
      status: "submitted",
      progress: 20,
      submittedDate: "2024-01-23",
      lastUpdate: "2024-01-23",
      description: "Multiple trash bins are overflowing and attracting pests.",
      departmentResponse: "Report received and under review by sanitation department.",
      estimatedCompletion: "Within 5 business days",
      priority: "low"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-warning text-warning-foreground";
      case "in-progress": return "bg-primary text-primary-foreground";
      case "resolved": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted": return <Clock className="w-4 h-4" />;
      case "in-progress": return <AlertCircle className="w-4 h-4" />;
      case "resolved": return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  // Calculate user stats
  const totalReports = userReports.length;
  const resolvedReports = userReports.filter(r => r.status === "resolved").length;
  const inProgressReports = userReports.filter(r => r.status === "in-progress").length;
  const userPoints = resolvedReports * 50 + inProgressReports * 20 + (totalReports - resolvedReports - inProgressReports) * 10;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold civic-gradient bg-clip-text text-transparent mb-2">
          My Reports
        </h1>
        <p className="text-muted-foreground">
          Track the status of your civic issue reports
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{totalReports}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-success">{resolvedReports}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-primary">{inProgressReports}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Civic Points</p>
                <p className="text-2xl font-bold text-accent">{userPoints}</p>
              </div>
              <Award className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {userReports.map((report) => (
          <Card key={report.id} className="shadow-soft hover:shadow-strong transition-civic">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{report.category}</Badge>
                    <Badge className={getStatusColor(report.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.status.replace("-", " ")}</span>
                      </div>
                    </Badge>
                    <span className={`text-xs font-medium ${getPriorityColor(report.priority)}`}>
                      {report.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Report #{report.id}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{report.progress}%</span>
                </div>
                <Progress value={report.progress} className="h-2" />
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-1">Issue Description</h4>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>

              {/* Department Response */}
              {report.departmentResponse && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm">Department Response</h4>
                  <p className="text-sm text-muted-foreground">{report.departmentResponse}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{new Date(report.submittedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Update</p>
                  <p className="font-medium">{new Date(report.lastUpdate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. Completion</p>
                  <p className="font-medium">{report.estimatedCompletion}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievement Section */}
      <Card className="mt-8 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            Community Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold">Community Helper</h3>
              <p className="text-sm text-muted-foreground">Resolved {resolvedReports} issues</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold">Active Citizen</h3>
              <p className="text-sm text-muted-foreground">{userPoints} civic points earned</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold">Top Reporter</h3>
              <p className="text-sm text-muted-foreground">Rank #12 this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyReports;