import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Upload, Mic, MicOff, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ReportForm = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const { toast } = useToast();

  const categories = [
    { value: "pothole", label: "Pothole", color: "bg-destructive" },
    { value: "garbage", label: "Garbage Collection", color: "bg-warning" },
    { value: "water-leak", label: "Water Leak", color: "bg-primary" },
    { value: "streetlight", label: "Street Light", color: "bg-accent" },
    { value: "graffiti", label: "Graffiti", color: "bg-secondary" },
    { value: "traffic", label: "Traffic Signal", color: "bg-destructive" },
    { value: "sidewalk", label: "Sidewalk Issue", color: "bg-muted-foreground" },
    { value: "other", label: "Other", color: "bg-foreground" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    toast({
      title: "Report Submitted Successfully!",
      description: "Your issue has been submitted to the municipal department. You'll receive updates via email.",
    });

    // Reset form
    setSelectedCategory("");
    setDescription("");
    setLocation("");
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Voice Recording Started",
        description: "Speak now to describe the issue...",
      });
    } else {
      toast({
        title: "Voice Recording Stopped",
        description: "Your voice input has been processed.",
      });
    }
  };

  const getCurrentLocation = () => {
    toast({
      title: "Fetching Location...",
      description: "Using GPS to get your current location.",
    });
    
    // Simulate location fetch
    setTimeout(() => {
      setLocation("123 Main St, Downtown District");
      toast({
        title: "Location Updated",
        description: "Current location has been added to your report.",
      });
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Card className="shadow-soft">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold civic-gradient bg-clip-text text-transparent">
            Report a Civic Issue
          </CardTitle>
          <p className="text-muted-foreground">
            Help improve your community by reporting local issues
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Issue Category *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the type of issue" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Photo/Video Upload */}
            <div className="space-y-2">
              <Label>Add Photos or Video</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="h-20 flex-col">
                  <Camera className="w-6 h-6 mb-2" />
                  <span className="text-sm">Take Photo</span>
                </Button>
                <Button type="button" variant="outline" className="h-20 flex-col">
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm">Upload File</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Photos help municipal staff understand and prioritize your report
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleRecording}
                  className={isRecording ? "text-destructive" : ""}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isRecording ? "Stop" : "Voice"}
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                required
              />
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  Recording... Speak now
                </Badge>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="flex space-x-2">
                <Input
                  id="location"
                  placeholder="Enter address or location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="px-3"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Accurate location helps staff respond quickly
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="civic"
              className="w-full h-12 text-lg"
              disabled={!selectedCategory || !description || !location}
            >
              <Send className="w-5 h-5 mr-2" />
              Submit Report
            </Button>
          </form>

          {/* Help Text */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Reports are reviewed within 2-3 business days. Emergency issues should be reported to 911.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportForm;