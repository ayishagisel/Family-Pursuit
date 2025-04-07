import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, FileImage, Share2, Check } from "lucide-react";
import { FamilyMember, Relationship } from "@shared/schema";
import TreeNode from "./TreeNode";
import RelationshipLine from "./RelationshipLine";
import { useToast } from "@/hooks/use-toast";

// Templates for different infographic styles
const TEMPLATES = [
  { id: "classic", name: "Classic Tree", bgColor: "#f8f9fa", textColor: "#1a202c" },
  { id: "modern", name: "Modern Minimal", bgColor: "#ffffff", textColor: "#2d3748" },
  { id: "colorful", name: "Colorful Circles", bgColor: "#f0f4f8", textColor: "#4a5568" },
  { id: "vintage", name: "Vintage Paper", bgColor: "#f5f0e6", textColor: "#5d4037" },
];

interface InfographicCreatorProps {
  onClose: () => void;
}

const InfographicCreator = ({ onClose }: InfographicCreatorProps) => {
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  // Fetch family members
  const { data: familyMembers = [], isLoading: isMembersLoading } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family-members"],
  });

  // Fetch relationships
  const { data: relationships = [], isLoading: isRelationshipsLoading } = useQuery<Relationship[]>({
    queryKey: ["/api/relationships"],
  });

  // Node position calculation
  const getNodePosition = (member: FamilyMember) => {
    // Simple layout algorithm 
    const positions: Record<number, { x: number, y: number }> = {
      // Generation 1
      1: { x: 400, y: 80 }, // John Smith (Grandfather)
      
      // Generation 2
      2: { x: 250, y: 200 }, // Robert Smith (Father)
      3: { x: 400, y: 200 }, // Linda Smith (Aunt)
      4: { x: 550, y: 200 }, // Michael Johnson (Adopted Son)
      
      // Generation 3
      5: { x: 175, y: 320 }, // Emily Smith (Sister)
      6: { x: 300, y: 320 }, // James Wilson (Step-Brother)
      7: { x: 425, y: 320 }, // Sarah Johnson (You)
      8: { x: 550, y: 320 }, // David Lee (Cousin)
      9: { x: 675, y: 320 }, // Jessica Lee (Cousin)
    };
    
    return positions[member.id] || { x: 0, y: 0 };
  };

  const getNodeSize = (member: FamilyMember) => {
    // Size based on generation (simplified)
    const sizes: Record<number, number> = {
      // Generation 1
      1: 40,
      
      // Generation 2
      2: 35,
      3: 35,
      4: 35,
      
      // Generation 3
      5: 30,
      6: 30,
      7: 30,
      8: 30,
      9: 30,
    };
    
    return sizes[member.id] || 30;
  };

  // Generate SVG as a data URL
  const generateSvgDataUrl = async () => {
    if (!svgRef.current) return null;
    
    try {
      // Clone the SVG to avoid modifying the displayed one
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
      
      // Add specific styling for the exported version
      const style = document.createElement("style");
      style.textContent = `
        svg {
          background-color: ${TEMPLATES.find(t => t.id === template)?.bgColor || "#f8f9fa"};
        }
        text {
          font-family: 'Arial', sans-serif;
          color: ${TEMPLATES.find(t => t.id === template)?.textColor || "#1a202c"};
        }
      `;
      svgClone.appendChild(style);
      
      // Add a title and footer to the SVG
      const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
      title.setAttribute("x", "400");
      title.setAttribute("y", "30");
      title.setAttribute("text-anchor", "middle");
      title.setAttribute("font-size", "24");
      title.setAttribute("font-weight", "bold");
      title.setAttribute("fill", TEMPLATES.find(t => t.id === template)?.textColor || "#1a202c");
      title.textContent = "Our Family Tree";
      svgClone.appendChild(title);
      
      const footer = document.createElementNS("http://www.w3.org/2000/svg", "text");
      footer.setAttribute("x", "400");
      footer.setAttribute("y", "450");
      footer.setAttribute("text-anchor", "middle");
      footer.setAttribute("font-size", "12");
      footer.setAttribute("fill", TEMPLATES.find(t => t.id === template)?.textColor || "#1a202c");
      footer.textContent = "Created with Family Pursuit App • " + new Date().toLocaleDateString();
      svgClone.appendChild(footer);
      
      // Set fixed dimensions for export
      svgClone.setAttribute("width", "800");
      svgClone.setAttribute("height", "480");
      
      // Convert SVG to string
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Create a Blob from the SVG string
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      
      // Convert Blob to URL
      return URL.createObjectURL(svgBlob);
    } catch (error) {
      console.error("Error generating SVG:", error);
      return null;
    }
  };

  // Handle generating the infographic
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const svgDataUrl = await generateSvgDataUrl();
      if (svgDataUrl) {
        setGeneratedImage(svgDataUrl);
        toast({
          title: "Infographic Created",
          description: "Your family tree infographic is ready to download!",
        });
      } else {
        throw new Error("Failed to generate SVG");
      }
    } catch (error) {
      console.error("Error in infographic generation:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error creating your infographic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle downloading the infographic
  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `family-tree-${new Date().toISOString().split("T")[0]}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Your family tree infographic is downloading.",
    });
  };

  // Determine selected template
  const selectedTemplate = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Family Tree Infographic Creator</CardTitle>
        <CardDescription>
          Create a beautiful visualization of your family tree with just one click
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {generatedImage ? (
          <div className="flex flex-col items-center">
            <div className="bg-white border rounded-lg p-2 mb-4 w-full overflow-auto">
              <img 
                src={generatedImage} 
                alt="Generated Family Tree Infographic" 
                className="max-w-full"
                style={{ maxHeight: "500px" }}
              />
            </div>
            
            <div className="flex gap-4 mb-4">
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download size={16} />
                Download SVG
              </Button>
              <Button variant="outline" onClick={() => setGeneratedImage(null)}>
                Create Another
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="style">Style Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-4">
                <div 
                  className="border rounded-lg overflow-hidden" 
                  style={{ 
                    backgroundColor: selectedTemplate.bgColor,
                    color: selectedTemplate.textColor,
                    minHeight: "400px" 
                  }}
                >
                  {(isMembersLoading || isRelationshipsLoading) ? (
                    <div className="flex items-center justify-center h-80">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <svg 
                      ref={svgRef}
                      width="100%" 
                      height="460px" 
                      viewBox="0 0 800 480" 
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Title */}
                      <text
                        x="400"
                        y="30"
                        textAnchor="middle"
                        fontSize="24"
                        fontWeight="bold"
                        fill={selectedTemplate.textColor}
                      >
                        Our Family Tree
                      </text>
                      
                      {/* Main Tree Group */}
                      <g transform="translate(0, 0)">
                        {/* Relationship Lines */}
                        {relationships.map((relationship) => {
                          const sourceMember = familyMembers.find((m) => m.id === relationship.source_id);
                          const targetMember = familyMembers.find((m) => m.id === relationship.target_id);
                          
                          if (!sourceMember || !targetMember) return null;
                          
                          const sourcePos = getNodePosition(sourceMember);
                          const targetPos = getNodePosition(targetMember);
                          
                          return (
                            <RelationshipLine 
                              key={relationship.id}
                              x1={sourcePos.x}
                              y1={sourcePos.y}
                              x2={targetPos.x}
                              y2={targetPos.y}
                              type={relationship.relationship_type}
                            />
                          );
                        })}
                        
                        {/* Family Member Nodes */}
                        {familyMembers.map((member) => {
                          const position = getNodePosition(member);
                          const size = getNodeSize(member);
                          
                          return (
                            <TreeNode 
                              key={member.id}
                              member={member}
                              x={position.x}
                              y={position.y}
                              size={size}
                              onClick={() => {}} // No click action in the infographic
                              isCurrentUser={member.id === 7} // Hardcoded for demo
                            />
                          );
                        })}
                      </g>
                      
                      {/* Footer */}
                      <text
                        x="400"
                        y="450"
                        textAnchor="middle"
                        fontSize="12"
                        fill={selectedTemplate.textColor}
                      >
                        Created with Family Pursuit App • {new Date().toLocaleDateString()}
                      </text>
                    </svg>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Template Style</label>
                    <Select 
                      value={template} 
                      onValueChange={setTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATES.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div 
                      className="w-8 h-8 rounded-full border" 
                      style={{ backgroundColor: selectedTemplate.bgColor }}
                    ></div>
                    <span>Background Color</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                      style={{ backgroundColor: selectedTemplate.textColor }}
                    >
                      <span className="text-white text-xs">T</span>
                    </div>
                    <span>Text Color</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        
        {!generatedImage && (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileImage className="mr-2 h-4 w-4" />
                Generate Infographic
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default InfographicCreator;