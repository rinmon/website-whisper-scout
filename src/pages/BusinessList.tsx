import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/hooks/useBusinessData";
import { Business } from "@/types/business";

const ITEMS_PER_PAGE = 12;

const BusinessList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { businesses, isLoading, error } = useBusinessData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [industryFilter, setIndustryFilter] = useState(searchParams.get("industry") || "all");
  const [scoreFilter, setScoreFilter] = useState(searchParams.get("score") || "all");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "ログアウトしました",
      description: "ご利用ありがとうございました",
    });
  };

  const handleBusinessDetail = (businessId: string) => {
    const currentSearchParams = location.search;
    navigate(`/business/${businessId}`, {
      state: { searchParams: currentSearchParams }
    });
  };

  // URLパラメータを更新
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (industryFilter !== "all") params.set("industry", industryFilter);
    if (scoreFilter !== "all") params.set("score", scoreFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params);
  }, [searchTerm, industryFilter, scoreFilter, currentPage, setSearchParams]);

  useEffect(() => {
    if (error) {
      toast({
        title: "データ取得エラー",
        description: "企業データの取得に失敗しました",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    // フィルタリングロジック
    let filtered = businesses;

    if (searchTerm) {
      filtered = filtered.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter(business => business.industry === industryFilter);
    }

    if (scoreFilter !== "all") {
      if (scoreFilter === "low") {
        filtered = filtered.filter(business => (business.overall_score || 0) < 2.5);
      } else if (scoreFilter === "medium") {
        filtered = filtered.filter(business => (business.overall_score || 0) >= 2.5 && (business.overall_score || 0) < 3.5);
      } else if (scoreFilter === "high") {
        filtered = filtered.filter(business => (business.overall_score || 0) >= 3.5);
      } else if (scoreFilter === "no-website") {
        filtered = filtered.filter(business => !business.has_website);
      }
    }

    setFilteredBusinesses(filtered);
    // フィルター変更時は1ページ目に戻る
    setCurrentPage(1);
  }, [searchTerm, industryFilter, scoreFilter, businesses]);

  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBusinesses = filteredBusinesses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 3.5) return "default";
    if (score >= 2.5) return "secondary";
    return "destructive";
  };

  const getAIContentBadge = (aiScore: number | null) => {
    if (aiScore === null) return null;
    if (aiScore >= 0.7) return <Badge variant="destructive">AI生成疑い</Badge>;
    if (aiScore >= 0.3) return <Badge variant="secondary">AI混合</Badge>;
    return <Badge variant="default">人間作成</Badge>;
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              企業一覧
            </h1>
            <p className="text-muted-foreground">登録済み企業の詳細情報</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {filteredBusinesses.length} 件の企業
            </Badge>
            <Button variant="outline" onClick={() => navigate("/")}>
              ダッシュボードに戻る
            </Button>
          </div>
        </div>

        {/* フィルターエリア */}
        <Card>
          <CardHeader>
            <CardTitle>検索・フィルター</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="企業名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
              <Select value={industryFilter} onValueChange={setIndustryFilter} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="業界選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全業界</SelectItem>
                  <SelectItem value="IT">IT・情報サービス</SelectItem>
                  <SelectItem value="建設業">建設業</SelectItem>
                  <SelectItem value="農業">農業</SelectItem>
                  <SelectItem value="商業">商業・卸売</SelectItem>
                  <SelectItem value="サービス業">サービス業</SelectItem>
                </SelectContent>
              </Select>
              <Select value={scoreFilter} onValueChange={setScoreFilter} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="スコア別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全スコア</SelectItem>
                  <SelectItem value="no-website">サイトなし</SelectItem>
                  <SelectItem value="low">低品質 (2.5未満)</SelectItem>
                  <SelectItem value="medium">中品質 (2.5-3.5)</SelectItem>
                  <SelectItem value="high">高品質 (3.5以上)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ローディング状態 */}
        {isLoading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <div className="font-medium">企業データを取得中...</div>
                  <div className="text-sm text-muted-foreground">
                    オープンデータソースから最新の企業情報を取得しています
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 企業リスト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentBusinesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{business.name}</CardTitle>
                      {business.is_new && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {business.industry} • {business.location}
                    </CardDescription>
                    {business.data_source && (
                      <div className="text-xs text-muted-foreground mt-1">
                        データ元: {business.data_source}
                      </div>
                    )}
                    {business.last_analyzed && (
                      <div className="text-xs text-muted-foreground">
                        分析日: {business.last_analyzed}
                      </div>
                    )}
                  </div>
                  <Badge variant={getScoreBadgeVariant(business.overall_score || 0)}>
                    {business.has_website ? (business.overall_score || 0).toFixed(1) : "サイトなし"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {business.has_website ? (
                    <>
                      {/* スコア表示 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>技術力</span>
                          <span>{(business.technical_score || 0).toFixed(1)}</span>
                        </div>
                        <Progress value={(business.technical_score || 0) * 20} className="h-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span>信頼性 (E-E-A-T)</span>
                          <span>{(business.eeat_score || 0).toFixed(1)}</span>
                        </div>
                        <Progress value={(business.eeat_score || 0) * 20} className="h-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span>コンテンツ</span>
                          <span>{(business.content_score || 0).toFixed(1)}</span>
                        </div>
                        <Progress value={(business.content_score || 0) * 20} className="h-2" />
                      </div>

                      {/* AIコンテンツ検出 */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">コンテンツ品質:</span>
                        {getAIContentBadge(business.ai_content_score)}
                      </div>

                      {/* ウェブサイトURL */}
                      {business.website_url && (
                        <div className="text-sm">
                          <a 
                            href={business.website_url.startsWith('http') ? business.website_url : `https://${business.website_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline truncate block"
                          >
                            {business.website_url}
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-red-500 font-medium">ウェブサイトなし</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        ホームページ制作の提案チャンス！
                      </div>
                    </div>
                  )}

                  {/* 企業詳細情報 */}
                  {business.employee_count && (
                    <div className="text-xs text-muted-foreground">
                      従業員数: {business.employee_count} • 設立: {business.established_year}年
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleBusinessDetail(business.id)}
                  >
                    詳細分析
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {filteredBusinesses.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">該当する企業が見つかりませんでした。</div>
            <div className="text-sm text-muted-foreground mt-1">
              フィルター条件を変更してみてください。
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BusinessList;
