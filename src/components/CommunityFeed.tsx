import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  ThumbsUp, 
  MessageCircle, 
  Clock, 
  Search, 
  Filter,
  Map,
  List,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";

const CommunityFeed = () => {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for community reports
  const communityReports = [
    {
      id: 1,
      category: "Pothole",
      title: "Large pothole on Main Street",
      description: "Dangerous pothole near the intersection causing vehicle damage",
      location: "Main St & 1st Ave",
      status: "in-progress",
      upvotes: 23,
      comments: 5,
      timeAgo: "2 hours ago",
      reporter: "John D.",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      category: "Streetlight",
      title: "Broken streetlight in park",
      description: "Safety concern - streetlight has been out for a week",
      location: "Central Park, North Entrance",
      status: "submitted",
      upvotes: 15,
      comments: 3,
      timeAgo: "5 hours ago",
      reporter: "Sarah M.",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      category: "Garbage",
      title: "Overflowing trash bins",
      description: "Multiple bins overflowing, attracting pests",
      location: "Pine Street Commercial District",
      status: "resolved",
      upvotes: 8,
      comments: 2,
      timeAgo: "1 day ago",
      reporter: "Mike L.",
      image: "/placeholder.svg"
    },
    {
      id: 4,
      category: "Water Leak",
      title: "Water main leak",
      description: "Suspected water main leak causing street flooding",
      location: "Oak Avenue near School",
      status: "in-progress",
      upvotes: 31,
      comments: 12,
      timeAgo: "3 hours ago",
      reporter: "Lisa K.",
      image: "/placeholder.svg"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-warning";
      case "in-progress": return "bg-primary";
      case "resolved": return "bg-success";
      default: return "bg-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted": return <Clock className="w-3 h-3" />;
      case "in-progress": return <AlertCircle className="w-3 h-3" />;
      case "resolved": return <CheckCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const filteredReports = communityReports.filter(report => {
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold civic-gradient bg-clip-text text-transparent mb-2">
          Community Issues
        </h1>
        <p className="text-muted-foreground">
          Browse and support civic issues reported by your community
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search issues or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("map")}
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "map")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Map View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No issues found matching your filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} className="shadow-soft hover:shadow-strong transition-civic">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{report.category}</Badge>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                          <span className="text-xs text-muted-foreground capitalize">
                            {report.status.replace("-", " ")}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{report.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {report.timeAgo}
                        </div>
                        <span>by {report.reporter}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {report.upvotes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {report.comments}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getStatusIcon(report.status)}
                      <span className="capitalize">{report.status.replace("-", " ")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="map">
          <Card className="h-96 shadow-soft">
            <CardContent className="h-full p-4">
              <div className="h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
                  <p className="text-muted-foreground">
                    Map integration will show all reported issues with location pins
                  </p>
                  <Button variant="outline" className="mt-4">
                    Enable Map View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityFeed;