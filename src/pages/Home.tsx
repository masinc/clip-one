import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">ClipOne</h1>
          <p className="text-muted-foreground">クリップボード履歴管理</p>
        </div>

        <div className="space-y-4">
          <Input 
            placeholder="履歴を検索..." 
            className="w-full"
          />
          
          <Card>
            <CardHeader>
              <CardTitle>クリップボード履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {/* モックデータ - 後で実際のデータに置き換え */}
                  {Array.from({ length: 10 }, (_, i) => (
                    <Card key={i} className="p-3 hover:bg-muted/50 cursor-pointer">
                      <p className="text-sm">サンプルテキスト {i + 1}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date().toLocaleString()}
                      </p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button>クリア</Button>
            <Button variant="outline">エクスポート</Button>
          </div>
        </div>
      </div>
    </div>
  );
}