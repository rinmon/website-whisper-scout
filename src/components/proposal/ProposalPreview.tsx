
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProposalPreviewProps {
  generatedProposal: string;
}

const ProposalPreview = ({ generatedProposal }: ProposalPreviewProps) => {
  const { toast } = useToast();

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
  );
};

export default ProposalPreview;
