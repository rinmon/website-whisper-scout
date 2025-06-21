
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Share2, Copy, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  target: string;
  content: string;
}

const SalesProposalGenerator = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customContent, setCustomContent] = useState<string>("");
  const [generatedProposal, setGeneratedProposal] = useState<string>("");

  const proposalTemplates: ProposalTemplate[] = [
    {
      id: "no-website",
      name: "ウェブサイト未保有企業向け",
      description: "ホームページ制作の基本提案",
      target: "サイトなし企業",
      content: `【ウェブサイト制作のご提案】

貴社の事業拡大に向けて、ウェブサイト制作をご提案いたします。

■ 現状分析
・ウェブサイトを保有されていない状況
・デジタル時代における機会損失の可能性
・競合他社との差別化の必要性

■ 提案内容
・レスポンシブデザインによるホームページ制作
・SEO対策の基本設定
・お問い合わせフォームの設置
・基本的なコンテンツ管理機能

■ 期待効果
・新規顧客の獲得機会創出
・企業の信頼性向上
・24時間365日の営業活動
・既存顧客への情報発信強化

■ 投資回収見込み
・制作費用：○○万円
・月間維持費：○○円
・予想新規問い合わせ増加：月○件`
    },
    {
      id: "low-quality",
      name: "低品質サイト改善提案",
      description: "既存サイトのリニューアル提案",
      target: "低品質サイト企業",
      content: `【ウェブサイトリニューアルのご提案】

貴社ウェブサイトの分析結果を基に、改善提案をいたします。

■ 現状分析結果
・現在のスコア：○.○点（5点満点）
・主な課題：レスポンシブ未対応、読み込み速度、SEO対策不足
・競合比較：業界平均を下回る状況

■ 改善提案
1. レスポンシブデザイン対応
2. ページ表示速度の最適化
3. SEO対策の強化
4. ユーザビリティの向上
5. セキュリティ強化

■ 具体的な効果予測
・検索順位の向上（予想：○位→○位）
・コンバージョン率改善（予想：○%→○%）
・ユーザーエクスペリエンス向上
・モバイルユーザーへの対応改善

■ 段階的実施案
Phase1: 緊急課題の対応（○ヶ月）
Phase2: 機能追加・強化（○ヶ月）
Phase3: 運用最適化（継続）`
    },
    {
      id: "content-marketing",
      name: "コンテンツマーケティング提案",
      description: "コンテンツ強化による集客提案",
      target: "コンテンツ不足企業",
      content: `【コンテンツマーケティング戦略のご提案】

貴社の専門性を活かしたコンテンツマーケティングをご提案いたします。

■ 現状と課題
・ウェブサイトのコンテンツ不足
・検索流入の機会損失
・専門性のアピール不足
・顧客との接点創出の必要性

■ コンテンツ戦略
1. 業界専門ブログの定期更新
2. 事例紹介コンテンツの作成
3. FAQ・よくある質問の充実
4. 動画コンテンツの活用
5. ダウンロード資料の提供

■ SEO対策
・業界関連キーワードでの上位表示
・ロングテールキーワード対策
・内部リンク構造の最適化
・定期的なコンテンツ更新

■ 予想成果
・月間PV数：○倍増加
・お問い合わせ数：○%増加
・検索順位：○位以内のキーワード○個
・ブランド認知度の向上`
    }
  ];

  const generateProposal = () => {
    const template = proposalTemplates.find(t => t.id === selectedTemplate);
    if (!template) {
      toast({
        title: "テンプレートを選択してください",
        description: "営業提案書を生成するにはテンプレートを選択する必要があります。",
        variant: "destructive"
      });
      return;
    }

    const proposal = customContent ? 
      `${template.content}\n\n【カスタム追記】\n${customContent}` : 
      template.content;
    
    setGeneratedProposal(proposal);
    
    toast({
      title: "提案書を生成しました",
      description: "内容を確認・編集してご利用ください。"
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedProposal);
    toast({
      title: "コピーしました",
      description: "提案書をクリップボードにコピーしました。"
    });
  };

  const downloadProposal = () => {
    const blob = new Blob([generatedProposal], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `営業提案書_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "ダウンロード開始",
      description: "提案書をダウンロードしました。"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            営業提案書生成
          </CardTitle>
          <CardDescription>
            分析データを基にした営業提案書を自動生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* テンプレート選択 */}
          <div className="space-y-3">
            <h4 className="font-medium">提案テンプレート</h4>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="提案書のテンプレートを選択" />
              </SelectTrigger>
              <SelectContent>
                {proposalTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 選択されたテンプレートの詳細 */}
          {selectedTemplate && (
            <div className="p-4 bg-blue-50 rounded-lg border">
              {(() => {
                const template = proposalTemplates.find(t => t.id === selectedTemplate);
                return template ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-blue-900">{template.name}</h5>
                      <Badge variant="secondary">{template.target}</Badge>
                    </div>
                    <p className="text-sm text-blue-800">{template.description}</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* カスタム追加内容 */}
          <div className="space-y-3">
            <h4 className="font-medium">カスタム追加内容（オプション）</h4>
            <Textarea
              placeholder="特別な提案内容や顧客固有の情報があれば追加してください..."
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              rows={4}
            />
          </div>

          {/* 生成ボタン */}
          <div className="flex justify-center">
            <Button 
              onClick={generateProposal}
              disabled={!selectedTemplate}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              提案書を生成
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 生成された提案書 */}
      {generatedProposal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>生成された営業提案書</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  コピー
                </Button>
                <Button variant="outline" size="sm" onClick={downloadProposal}>
                  <Download className="mr-2 h-4 w-4" />
                  ダウンロード
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm font-mono">{generatedProposal}</pre>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>注意：</strong>この提案書はテンプレートを基に生成されています。
                実際の営業活動前に、顧客の具体的な状況に合わせて内容を調整してください。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesProposalGenerator;
