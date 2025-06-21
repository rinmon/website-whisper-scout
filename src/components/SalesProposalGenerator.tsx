
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { proposalTemplates } from "./proposal/ProposalTemplates";
import ProposalPreview from "./proposal/ProposalPreview";

const SalesProposalGenerator = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customContent, setCustomContent] = useState<string>("");
  const [generatedProposal, setGeneratedProposal] = useState<string>("");

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

          <div className="space-y-3">
            <h4 className="font-medium">カスタム追加内容（オプション）</h4>
            <Textarea
              placeholder="特別な提案内容や顧客固有の情報があれば追加してください..."
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              rows={4}
            />
          </div>

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

      {generatedProposal && (
        <ProposalPreview generatedProposal={generatedProposal} />
      )}
    </div>
  );
};

export default SalesProposalGenerator;
