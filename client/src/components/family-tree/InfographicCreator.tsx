import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Download, FileDown, AlertCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import types from shared schema
import { FamilyMember, Relationship } from '@shared/schema';

interface InfographicCreatorProps {
  onClose: () => void;
}

const THEMES = {
  classic: {
    background: "#ffffff",
    nodeColor: "#e2e8f0",
    textColor: "#1e293b",
    lineColor: "#94a3b8",
    borderColor: "#cbd5e1",
    fontFamily: "'Inter', sans-serif"
  },
  modern: {
    background: "#0f172a",
    nodeColor: "#1e293b",
    textColor: "#f8fafc",
    lineColor: "#64748b",
    borderColor: "#334155",
    fontFamily: "'Inter', sans-serif"
  },
  nature: {
    background: "#f0fdf4",
    nodeColor: "#dcfce7",
    textColor: "#166534",
    lineColor: "#86efac",
    borderColor: "#bbf7d0",
    fontFamily: "'Inter', sans-serif"
  },
  vintage: {
    background: "#fffbeb",
    nodeColor: "#fef3c7",
    textColor: "#92400e",
    lineColor: "#fcd34d",
    borderColor: "#fde68a",
    fontFamily: "'Playfair Display', serif"
  }
};

const InfographicCreator: React.FC<InfographicCreatorProps> = ({ onClose }) => {
  const [title, setTitle] = useState("My Family Tree");
  const [theme, setTheme] = useState<keyof typeof THEMES>("classic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("design");
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Fetch family members
  const { data: familyMembers, isLoading: isFamilyLoading, error: familyError } = useQuery<FamilyMember[]>({
    queryKey: ['/api/family-members'],
  });

  // Fetch relationships
  const { data: relationships, isLoading: isRelationshipsLoading, error: relationshipsError } = useQuery<Relationship[]>({
    queryKey: ['/api/relationships'],
  });

  // Calculate positions for all nodes in a hierarchical tree layout
  const calculateTreeLayout = () => {
    if (!familyMembers || !relationships) return null;
    
    const width = 1200;
    const height = 800;
    const nodeRadius = 50;
    const padding = 100;
    const levelHeight = 120; // Vertical distance between generations
    
    // Define node type for better type safety
    interface TreeNode {
      id: number;
      name: string;
      role: string;
      children: Array<{node: TreeNode, type: string}>;
      level: number;
      x: number;
      y: number;
      member: FamilyMember;
    }
    
    // Create a map of node IDs to their data
    const nodeMap = new Map<number, TreeNode>();
    familyMembers.forEach(member => {
      nodeMap.set(member.id, {
        id: member.id,
        name: member.name,
        role: member.role,
        children: [],
        level: 0, // Will be calculated later
        x: 0,     // Will be calculated later
        y: 0,     // Will be calculated later
        member
      });
    });
    
    // Build the relationship tree
    relationships.forEach(rel => {
      const sourceNode = nodeMap.get(rel.source_id);
      const targetNode = nodeMap.get(rel.target_id);
      
      if (sourceNode && targetNode) {
        // Add to children array
        if (rel.relationship_type === 'biological' || rel.relationship_type === 'adoptive') {
          // Only consider parent->child relationships for the tree structure
          sourceNode.children.push({
            node: targetNode,
            type: rel.relationship_type
          });
        }
      }
    });
    
    // Find potential root nodes (members with no parents)
    const childIds = new Set<number>();
    relationships.forEach(rel => {
      childIds.add(rel.target_id);
    });
    
    const rootNodes = Array.from(nodeMap.values()).filter(node => !childIds.has(node.id));
    
    // If no clear root, take the first node
    const roots = rootNodes.length > 0 ? rootNodes : [nodeMap.get(familyMembers[0].id)];
    
    // Assign levels to nodes (depth in the tree)
    const assignLevels = (node: TreeNode, level: number): void => {
      node.level = Math.max(node.level, level);
      node.children.forEach(child => {
        assignLevels(child.node, level + 1);
      });
    };
    
    roots.forEach(root => {
      if (root) assignLevels(root, 0);
    });
    
    // Group nodes by their level
    const levelGroups: Array<Array<TreeNode>> = [];
    nodeMap.forEach(node => {
      if (!levelGroups[node.level]) {
        levelGroups[node.level] = [];
      }
      levelGroups[node.level].push(node);
    });
    
    // Calculate horizontal positions for nodes on each level
    levelGroups.forEach((group: Array<TreeNode>, level: number) => {
      const levelWidth = width - padding * 2;
      const nodeSpacing = levelWidth / (group.length + 1);
      
      group.forEach((node: TreeNode, i: number) => {
        node.x = padding + nodeSpacing * (i + 1);
        node.y = padding + level * levelHeight;
      });
    });
    
    // Handle orphan nodes
    const orphans = Array.from(nodeMap.values()).filter(node => node.level === 0 && !rootNodes.includes(node));
    if (orphans.length > 0) {
      const orphanLevel = levelGroups.length;
      const levelWidth = width - padding * 2;
      const nodeSpacing = levelWidth / (orphans.length + 1);
      
      orphans.forEach((node: TreeNode, i: number) => {
        node.x = padding + nodeSpacing * (i + 1);
        node.y = padding + orphanLevel * levelHeight;
      });
    }
    
    // Create array of nodes and links for rendering
    const nodes = Array.from(nodeMap.values());
    const links = relationships.map(rel => {
      const source = nodes.findIndex(n => n.id === rel.source_id);
      const target = nodes.findIndex(n => n.id === rel.target_id);
      return { 
        source, 
        target, 
        type: rel.relationship_type
      };
    }).filter(link => link.source !== -1 && link.target !== -1);
    
    return { nodes, links, width, height };
  };

  // Generate SVG for the tree
  const generateTreeSVG = () => {
    const layout = calculateTreeLayout();
    if (!layout) return null;
    
    const { nodes, links, width, height } = layout;
    const currentTheme = THEMES[theme];
    
    return (
      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ background: currentTheme.background }}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {/* Title */}
        <text
          x={width / 2}
          y={40}
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fontFamily={currentTheme.fontFamily}
          fill={currentTheme.textColor}
        >
          {title}
        </text>
        
        {/* Links */}
        {links.map((link, idx) => {
          const sourceNode = nodes[link.source];
          const targetNode = nodes[link.target];
          
          // Generate a curved path for parent-child relationships
          const isParentChild = targetNode.level > sourceNode.level;
          
          if (isParentChild) {
            // Create a curved path for parent-child relationships
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = sourceNode.y + (targetNode.y - sourceNode.y) / 2;
            
            const path = `M ${sourceNode.x} ${sourceNode.y} 
                          Q ${midX} ${midY - 20}, ${targetNode.x} ${targetNode.y}`;
            
            return (
              <path
                key={`link-${idx}`}
                d={path}
                fill="none"
                stroke={currentTheme.lineColor}
                strokeWidth="2"
                strokeDasharray={link.type === 'biological' ? 'none' : '5,5'}
              />
            );
          } else {
            // Use a straight dashed line for other relationships
            return (
              <line
                key={`link-${idx}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={currentTheme.lineColor}
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            );
          }
        })}
        
        {/* Nodes */}
        {nodes.map((node) => {
          const initials = node.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
            
          return (
            <g key={`node-${node.id}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r="40"
                fill={currentTheme.nodeColor}
                stroke={currentTheme.borderColor}
                strokeWidth="2"
                filter="url(#shadow)"
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="18"
                fontWeight="bold"
                fontFamily={currentTheme.fontFamily}
                fill={currentTheme.textColor}
              >
                {initials}
              </text>
              <text
                x={node.x}
                y={node.y + 60}
                textAnchor="middle"
                fontSize="14"
                fontFamily={currentTheme.fontFamily}
                fill={currentTheme.textColor}
              >
                {node.name}
              </text>
              <text
                x={node.x}
                y={node.y + 80}
                textAnchor="middle"
                fontSize="12"
                fontFamily={currentTheme.fontFamily}
                fill={currentTheme.textColor}
                fontStyle="italic"
              >
                {node.role}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Download SVG as PNG
  const downloadAsPNG = () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!svgRef.current) {
        setError("Could not generate image. SVG element not found.");
        setLoading(false);
        return;
      }
      
      const svgElement = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Set canvas dimensions
      canvas.width = svgElement.width.baseVal.value;
      canvas.height = svgElement.height.baseVal.value;
      
      const image = new Image();
      
      image.onload = () => {
        if (!ctx) {
          setError("Could not generate image. Canvas context not available.");
          setLoading(false);
          return;
        }
        
        // Draw white background
        ctx.fillStyle = THEMES[theme].background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image
        ctx.drawImage(image, 0, 0);
        
        // Convert to data URL and trigger download
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        
        downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}-family-tree.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        
        setLoading(false);
        toast({
          title: "Success!",
          description: "Your family tree infographic has been downloaded.",
        });
      };
      
      image.onerror = () => {
        setError("Failed to generate image. Please try again.");
        setLoading(false);
      };
      
      // Load the SVG data
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      
      image.src = url;
    } catch (err) {
      console.error("Error in infographic generation:", err);
      setError("An error occurred while generating the infographic. Please try again.");
      setLoading(false);
    }
  };

  // Download as SVG
  const downloadAsSVG = () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!svgRef.current) {
        setError("Could not generate SVG. SVG element not found.");
        setLoading(false);
        return;
      }
      
      const svgElement = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}-family-tree.svg`;
      downloadLink.click();
      
      URL.revokeObjectURL(svgUrl);
      setLoading(false);
      
      toast({
        title: "Success!",
        description: "Your family tree SVG has been downloaded.",
      });
    } catch (err) {
      console.error("Error in SVG generation:", err);
      setError("An error occurred while generating the SVG. Please try again.");
      setLoading(false);
    }
  };

  if (isFamilyLoading || isRelationshipsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <CardTitle>Creating Your Family Tree Infographic</CardTitle>
        <CardDescription>Loading family data...</CardDescription>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (familyError || relationshipsError) {
    return (
      <div className="p-6">
        <CardTitle>Error Loading Data</CardTitle>
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load family data. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <CardHeader>
        <CardTitle>Family Tree Infographic Creator</CardTitle>
        <CardDescription>Customize and download your family tree</CardDescription>
      </CardHeader>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1">
        <TabsList className="mx-6">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="design" className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Infographic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="My Family Tree"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as keyof typeof THEMES)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(THEMES).map(([key, colors]) => (
                    <div 
                      key={key}
                      className={`p-4 rounded-md cursor-pointer border-2 ${
                        theme === key ? 'border-primary' : 'border-border'
                      }`}
                      style={{ background: colors.background }}
                      onClick={() => setTheme(key as keyof typeof THEMES)}
                    >
                      <div 
                        className="rounded-full w-8 h-8 mb-2" 
                        style={{ background: colors.nodeColor, border: `2px solid ${colors.borderColor}` }} 
                      />
                      <div 
                        className="text-sm font-medium" 
                        style={{ color: colors.textColor, fontFamily: colors.fontFamily }}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>This is how your infographic will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={containerRef}
                className="w-full overflow-auto border rounded-md p-2"
                style={{ 
                  maxHeight: "500px",
                  background: THEMES[theme].background 
                }}
              >
                {familyMembers && familyMembers.length > 0 ? (
                  generateTreeSVG()
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No family members found. Add members to your family tree first.</p>
                  </div>
                )}
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
              <div className="space-x-2">
                <Button
                  onClick={downloadAsSVG}
                  variant="outline"
                  disabled={loading || !familyMembers || familyMembers.length === 0}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Download SVG
                </Button>
                <Button
                  onClick={downloadAsPNG}
                  disabled={loading || !familyMembers || familyMembers.length === 0}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PNG
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InfographicCreator;