import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccessibility, FontSize, ContrastMode } from '@/hooks/useAccessibility';
import { Accessibility, Type, Eye, Zap, RefreshCw } from 'lucide-react';

interface AccessibilityPanelProps {
  className?: string;
}

export function AccessibilityPanel({ className }: AccessibilityPanelProps) {
  const { 
    preferences, 
    setFontSize, 
    setContrastMode, 
    setReducedMotion, 
    resetToDefaults 
  } = useAccessibility();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5" />
          Accessibility Settings
        </CardTitle>
        <CardDescription>
          Customize the interface to meet your accessibility needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Size */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Font Size
          </Label>
          <Select 
            value={preferences.fontSize} 
            onValueChange={(value: FontSize) => setFontSize(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium (Default)</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="extra-large">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contrast Mode */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Contrast Mode
          </Label>
          <Select 
            value={preferences.contrastMode} 
            onValueChange={(value: ContrastMode) => setContrastMode(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High Contrast</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <Label htmlFor="reduced-motion" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Reduce Motion
          </Label>
          <Switch
            id="reduced-motion"
            checked={preferences.reducedMotion}
            onCheckedChange={setReducedMotion}
          />
        </div>

        {/* Reset Button */}
        <Button 
          onClick={resetToDefaults} 
          variant="outline" 
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
}