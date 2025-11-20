import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Gift, Heart, User, Mail, Calendar } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';

interface WishlistItem {
  wishlist_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  reward_id: string;
  reward_title: string;
  reward_cost: number;
  reward_image: string | null;
  reward_category: string;
  notes: string | null;
  added_at: string;
}

export function AdminWishlists() {
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [gifting, setGifting] = useState(false);

  useEffect(() => {
    fetchAllWishlists();
  }, []);

  const fetchAllWishlists = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_wishlist');

      if (error) throw error;
      setWishlists(data || []);
    } catch (error) {
      console.error('Error fetching wishlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wishlists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGiftReward = async () => {
    if (!selectedItem) return;

    setGifting(true);
    try {
      const { data, error } = await supabase.rpc('admin_gift_reward', {
        p_user_id: selectedItem.user_id,
        p_reward_id: selectedItem.reward_id,
        p_admin_notes: `Gifted from wishlist on ${new Date().toISOString()}`
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string; error?: string };

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Reward gifted successfully',
        });
        setShowGiftDialog(false);
        setSelectedItem(null);
        fetchAllWishlists();
      } else {
        throw new Error(result.error || 'Failed to gift reward');
      }
    } catch (error: any) {
      console.error('Error gifting reward:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to gift reward',
        variant: 'destructive',
      });
    } finally {
      setGifting(false);
    }
  };

  const groupedWishlists = wishlists.reduce((acc, item) => {
    if (!acc[item.user_id]) {
      acc[item.user_id] = {
        user: {
          id: item.user_id,
          email: item.user_email,
          name: item.user_name,
        },
        items: [],
      };
    }
    acc[item.user_id].items.push(item);
    return acc;
  }, {} as Record<string, { user: { id: string; email: string; name: string }; items: WishlistItem[] }>);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Member Wishlists</CardTitle>
              <CardDescription>
                View and manage member wishlist requests - {Object.keys(groupedWishlists).length} members with {wishlists.length} items
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedWishlists).length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Wishlist Items</h3>
              <p className="text-muted-foreground">
                No members have added items to their wishlist yet
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedWishlists).map(([userId, { user, items }]) => (
                <div key={userId} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{user.name || 'Unknown User'}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reward</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.wishlist_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={item.reward_image || '/placeholder.svg'}
                                  alt={item.reward_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium line-clamp-1">{item.reward_title}</p>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">{item.notes}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.reward_category}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.reward_cost} Claims</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.added_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowGiftDialog(true);
                              }}
                            >
                              <Gift className="h-4 w-4 mr-2" />
                              Gift
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gift Confirmation Dialog */}
      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gift Reward to Member</DialogTitle>
            <DialogDescription>
              This will add {selectedItem?.reward_cost} claims to {selectedItem?.user_name}'s balance and remove the item from their wishlist.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 my-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={selectedItem.reward_image || '/placeholder.svg'}
                    alt={selectedItem.reward_title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{selectedItem.reward_title}</p>
                  <p className="text-sm text-muted-foreground">
                    Cost: {selectedItem.reward_cost} Claims
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Recipient:</strong> {selectedItem.user_name}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {selectedItem.user_email}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGiftDialog(false)} disabled={gifting}>
              Cancel
            </Button>
            <Button onClick={handleGiftReward} disabled={gifting}>
              {gifting ? 'Gifting...' : 'Confirm Gift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
