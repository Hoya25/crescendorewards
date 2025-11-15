import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  X,
  ExternalLink,
  Star,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  GitCompare,
  AlertCircle,
  Download,
  FileImage,
} from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
  base_earning_rate: number;
  logo_emoji: string;
  logo_color: string;
  shop_url: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

const statusMultipliers = [
  { level: 0, name: 'No Status', multiplier: 1.0 },
  { level: 1, name: 'Bronze', multiplier: 1.1 },
  { level: 2, name: 'Silver', multiplier: 1.25 },
  { level: 3, name: 'Gold', multiplier: 1.4 },
  { level: 4, name: 'Platinum', multiplier: 1.6 },
  { level: 5, name: 'Diamond', multiplier: 2.0 },
];

export function AdminBrandComparison() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (error: any) {
      console.error('Error loading brands:', error);
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleBrand = (brand: Brand) => {
    const isSelected = selectedBrands.some((b) => b.id === brand.id);
    
    if (isSelected) {
      setSelectedBrands(selectedBrands.filter((b) => b.id !== brand.id));
    } else {
      if (selectedBrands.length >= 4) {
        toast.error('Maximum 4 brands can be compared at once');
        return;
      }
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const clearSelection = () => {
    setSelectedBrands([]);
  };

  const calculateMultipliedRate = (baseRate: number, multiplier: number) => {
    return (baseRate * multiplier).toFixed(2);
  };

  const getHighestRate = (metric: 'base' | 'max') => {
    if (selectedBrands.length === 0) return 0;
    
    if (metric === 'base') {
      return Math.max(...selectedBrands.map((b) => b.base_earning_rate));
    } else {
      return Math.max(
        ...selectedBrands.map((b) => b.base_earning_rate * 2.0)
      );
    }
  };

  const exportAsImage = async () => {
    if (!comparisonRef.current) return;
    
    try {
      setExporting(true);
      const canvas = await html2canvas(comparisonRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `brand-comparison-${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
      
      toast.success('Comparison exported as image');
    } catch (error) {
      console.error('Error exporting image:', error);
      toast.error('Failed to export image');
    } finally {
      setExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!comparisonRef.current) return;
    
    try {
      setExporting(true);
      const canvas = await html2canvas(comparisonRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`brand-comparison-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('Comparison exported as PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Brand Comparison</h2>
        <p className="text-muted-foreground">Compare brand earning rates and features side-by-side</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Brand Selection Panel */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Select Brands</span>
              <Badge variant="secondary">{selectedBrands.length}/4</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {selectedBrands.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={clearSelection}
              >
                <X className="w-4 h-4" />
                Clear Selection
              </Button>
            )}

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {filteredBrands.map((brand) => {
                  const isSelected = selectedBrands.some((b) => b.id === brand.id);
                  return (
                    <div
                      key={brand.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted border-border'
                      }`}
                      onClick={() => handleToggleBrand(brand)}
                    >
                      <Checkbox checked={isSelected} />
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: brand.logo_color }}
                      >
                        {brand.logo_emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{brand.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {brand.base_earning_rate} NCTR/$1
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Comparison View */}
        <div className="md:col-span-2">
          {selectedBrands.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Button
                onClick={exportAsImage}
                disabled={exporting}
                variant="outline"
                className="gap-2"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileImage className="w-4 h-4" />
                )}
                Export as Image
              </Button>
              <Button
                onClick={exportAsPDF}
                disabled={exporting}
                variant="outline"
                className="gap-2"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export as PDF
              </Button>
            </div>
          )}
          {selectedBrands.length === 0 ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GitCompare className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Brands Selected</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Select 2-4 brands from the list to compare their earning rates, categories, and features side-by-side
                </p>
              </CardContent>
            </Card>
          ) : (
            <div ref={comparisonRef} className="space-y-4 p-6 bg-background rounded-lg">
              {/* Alert for optimal comparison */}
              {selectedBrands.length === 1 && (
                <Card className="bg-muted">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Select more brands to compare</p>
                      <p className="text-xs text-muted-foreground">
                        Choose at least 2 brands for a meaningful comparison
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Brand Headers */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedBrands.length}, 1fr)` }}>
                {selectedBrands.map((brand) => (
                  <Card key={brand.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                          style={{ backgroundColor: brand.logo_color }}
                        >
                          {brand.logo_emoji}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleBrand(brand)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <h3 className="font-bold text-lg mb-1">{brand.name}</h3>
                      <Badge variant="secondary" className="mb-2">
                        {brand.category}
                      </Badge>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {brand.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Base Earning Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Base Earning Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedBrands.length}, 1fr)` }}>
                    {selectedBrands.map((brand) => {
                      const isHighest = brand.base_earning_rate === getHighestRate('base');
                      return (
                        <div key={brand.id} className="text-center">
                          <div className={`text-3xl font-bold mb-1 ${isHighest ? 'text-primary' : ''}`}>
                            {brand.base_earning_rate}
                          </div>
                          <div className="text-xs text-muted-foreground">NCTR per $1</div>
                          {isHighest && selectedBrands.length > 1 && (
                            <Badge className="mt-2" variant="default">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Highest
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Multiplied Rates by Status Level */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Earning Rates by Status Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusMultipliers.map((status) => (
                      <div key={status.level}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">{status.name}</div>
                          <Badge variant="outline">{status.multiplier}x</Badge>
                        </div>
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedBrands.length}, 1fr)` }}>
                          {selectedBrands.map((brand) => {
                            const rate = parseFloat(
                              calculateMultipliedRate(brand.base_earning_rate, status.multiplier)
                            );
                            const isHighest =
                              rate ===
                              Math.max(
                                ...selectedBrands.map((b) =>
                                  parseFloat(calculateMultipliedRate(b.base_earning_rate, status.multiplier))
                                )
                              );
                            return (
                              <div
                                key={brand.id}
                                className={`text-center p-2 rounded border ${
                                  isHighest && selectedBrands.length > 1
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border'
                                }`}
                              >
                                <div className="font-mono text-sm">
                                  {calculateMultipliedRate(brand.base_earning_rate, status.multiplier)}
                                </div>
                                <div className="text-xs text-muted-foreground">NCTR/$1</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Features & Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Featured Status */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedBrands.length}, 1fr)` }}>
                      <div className="col-span-full text-xs font-medium text-muted-foreground mb-1">
                        Featured Partner
                      </div>
                      {selectedBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-center">
                          {brand.is_featured ? (
                            <div className="flex items-center gap-2 text-primary">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Star className="w-4 h-4" />
                              <span className="text-sm">No</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Active Status */}
                    <div className="grid gap-4 pt-3 border-t" style={{ gridTemplateColumns: `repeat(${selectedBrands.length}, 1fr)` }}>
                      <div className="col-span-full text-xs font-medium text-muted-foreground mb-1">
                        Active Status
                      </div>
                      {selectedBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-center">
                          {brand.is_active ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm">Inactive</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Shop Links */}
                    <div className="grid gap-4 pt-3 border-t" style={{ gridTemplateColumns: `repeat(${selectedBrands.length}, 1fr)` }}>
                      <div className="col-span-full text-xs font-medium text-muted-foreground mb-1">
                        Shop Link
                      </div>
                      {selectedBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => window.open(brand.shop_url, '_blank')}
                          >
                            Visit
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Avg Base Rate</div>
                      <div className="text-xl font-bold">
                        {(
                          selectedBrands.reduce((sum, b) => sum + b.base_earning_rate, 0) /
                          selectedBrands.length
                        ).toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">NCTR/$1</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Rate Range</div>
                      <div className="text-xl font-bold">
                        {Math.min(...selectedBrands.map((b) => b.base_earning_rate))} -{' '}
                        {Math.max(...selectedBrands.map((b) => b.base_earning_rate))}
                      </div>
                      <div className="text-xs text-muted-foreground">NCTR/$1</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Featured</div>
                      <div className="text-xl font-bold">
                        {selectedBrands.filter((b) => b.is_featured).length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        of {selectedBrands.length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
