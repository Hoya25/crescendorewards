import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Send, Inbox, ArrowLeft, Copy, Mail, X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useGiftClaims } from '@/hooks/useGiftClaims';
import { ClaimsBalanceIndicator } from '@/components/claims/ClaimsBalanceIndicator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { ClaimGift } from '@/types/gifts';

const QUICK_AMOUNTS = [5, 10, 25, 50];

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case 'claimed':
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Claimed</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-muted text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function GiftClaimsPage() {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const { isLoading, sendGift, getSentGifts, getReceivedGifts, cancelGift } = useGiftClaims();
  
  const [activeTab, setActiveTab] = useState('send');
  const [giftsTab, setGiftsTab] = useState('sent');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [claimsAmount, setClaimsAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [sentGiftCode, setSentGiftCode] = useState('');
  const [sentGifts, setSentGifts] = useState<ClaimGift[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<ClaimGift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);

  const claimBalance = (profile?.crescendo_data as any)?.claims_balance || 0;
  const effectiveAmount = customAmount ? parseInt(customAmount) || 0 : claimsAmount;
  const canSend = effectiveAmount > 0 && effectiveAmount <= claimBalance && recipientEmail.includes('@');

  const loadGifts = useCallback(async () => {
    setLoadingGifts(true);
    const [sent, received] = await Promise.all([getSentGifts(), getReceivedGifts()]);
    setSentGifts(sent);
    setReceivedGifts(received);
    setLoadingGifts(false);
  }, [getSentGifts, getReceivedGifts]);

  useEffect(() => {
    if (activeTab === 'gifts') {
      loadGifts();
    }
  }, [activeTab, loadGifts]);

  const handleSendGift = async () => {
    const result = await sendGift(recipientEmail, effectiveAmount, message || undefined);
    setShowConfirmDialog(false);
    
    if (result.success && result.giftCode) {
      setSentGiftCode(result.giftCode);
      setShowSuccessDialog(true);
      setRecipientEmail('');
      setClaimsAmount(10);
      setCustomAmount('');
      setMessage('');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleCancelGift = async (giftId: string) => {
    const result = await cancelGift(giftId);
    if (result.success) {
      loadGifts();
    }
  };

  const copyGiftLink = () => {
    const link = `${window.location.origin}/claim?code=${sentGiftCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Gift link copied!');
  };

  const copyGiftCode = () => {
    navigator.clipboard.writeText(sentGiftCode);
    toast.success('Gift code copied!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Gift Claims
            </h1>
            <p className="text-muted-foreground">Share Claims with friends and family</p>
          </div>
          <ClaimsBalanceIndicator />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Gift
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              My Gifts
            </TabsTrigger>
          </TabsList>

          {/* Send Gift Tab */}
          <TabsContent value="send">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gift Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gift from your balance</CardTitle>
                  <CardDescription>
                    You have <span className="font-semibold text-foreground">{claimBalance}</span> Claims available
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Claims Amount</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {QUICK_AMOUNTS.map((amt) => (
                        <Button
                          key={amt}
                          variant={claimsAmount === amt && !customAmount ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setClaimsAmount(amt);
                            setCustomAmount('');
                          }}
                          disabled={amt > claimBalance}
                        >
                          {amt}
                        </Button>
                      ))}
                      <Input
                        type="number"
                        placeholder="Custom"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-24"
                        min={1}
                        max={claimBalance}
                      />
                    </div>
                    {effectiveAmount > claimBalance && (
                      <p className="text-sm text-destructive">Insufficient balance</p>
                    )}
                  </div>

                  {/* Recipient Email */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recipient Email</label>
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Personal Message (optional)</label>
                    <Textarea
                      placeholder="Happy birthday! Enjoy these Claims..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{message.length}/200</p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!canSend || isLoading}
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Send {effectiveAmount} Claims
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Gift Preview</CardTitle>
                  <CardDescription>How your gift will appear</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-card rounded-lg p-6 border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar>
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback>{profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile?.display_name || 'You'}</p>
                        <p className="text-sm text-muted-foreground">sent you a gift</p>
                      </div>
                    </div>
                    <div className="text-center py-6">
                      <Gift className="h-12 w-12 mx-auto text-primary mb-2" />
                      <p className="text-3xl font-bold">{effectiveAmount || 0} Claims</p>
                    </div>
                    {message && (
                      <div className="bg-muted/50 rounded-lg p-3 mt-4">
                        <p className="text-sm italic">"{message}"</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Gift expires in 30 days
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Gifts Tab */}
          <TabsContent value="gifts">
            <Tabs value={giftsTab} onValueChange={setGiftsTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
              </TabsList>

              <TabsContent value="sent">
                <Card>
                  <CardContent className="p-0">
                    {loadingGifts ? (
                      <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : sentGifts.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No gifts sent yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sentGifts.map((gift) => (
                            <TableRow key={gift.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={gift.recipient?.avatar_url || ''} />
                                    <AvatarFallback>{(gift.recipient?.display_name || gift.recipient_email || 'U').charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="truncate max-w-[150px]">
                                    {gift.recipient?.display_name || gift.recipient_email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{gift.claims_amount}</TableCell>
                              <TableCell>{getStatusBadge(gift.status)}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(gift.created_at), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="text-right">
                                {gift.status === 'pending' && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCancelGift(gift.id)}
                                          disabled={isLoading}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Cancel & Refund</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="received">
                <Card>
                  <CardContent className="p-0">
                    {loadingGifts ? (
                      <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : receivedGifts.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No gifts received yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>From</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receivedGifts.map((gift) => (
                            <TableRow key={gift.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={gift.sender?.avatar_url || ''} />
                                    <AvatarFallback>
                                      {gift.is_admin_gift ? '🎁' : (gift.sender?.display_name || 'U').charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {gift.is_admin_gift ? 'Crescendo Team' : gift.sender?.display_name || 'Unknown'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{gift.claims_amount}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                {gift.message || '-'}
                              </TableCell>
                              <TableCell>{getStatusBadge(gift.status)}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(gift.claimed_at || gift.created_at), 'MMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Gift</DialogTitle>
              <DialogDescription>
                You're about to send <span className="font-semibold">{effectiveAmount} Claims</span> to{' '}
                <span className="font-semibold">{recipientEmail}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Claims to send</span>
                <span className="font-medium">{effectiveAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Your new balance</span>
                <span className="font-medium">{claimBalance - effectiveAmount}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendGift} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Gift'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">
                <Gift className="h-12 w-12 mx-auto text-primary mb-2" />
                Gift Sent! 🎁
              </DialogTitle>
              <DialogDescription className="text-center">
                Your gift is on its way. Share the code below with the recipient.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Gift Code</p>
              <p className="text-2xl font-mono font-bold">{sentGiftCode}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyGiftCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
              <Button variant="outline" className="flex-1" onClick={copyGiftLink}>
                <Mail className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
