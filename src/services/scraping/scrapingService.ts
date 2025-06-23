
interface ScrapingConfig {
  maxRetries: number;
  retryDelay: number;
  requestDelay: number;
  userAgent: string;
  timeout: number;
}

interface CachedPage {
  url: string;
  content: string;
  lastModified: string;
  etag?: string;
  lastChecked: Date;
}

export class ScrapingService {
  private static readonly DEFAULT_CONFIG: ScrapingConfig = {
    maxRetries: 3,
    retryDelay: 2000,
    requestDelay: 3000, // 3秒間隔
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timeout: 30000
  };

  private static pageCache = new Map<string, CachedPage>();
  private static lastRequestTime = 0;

  static async fetchPage(url: string, config: Partial<ScrapingConfig> = {}): Promise<string> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    console.log(`🌐 ページ取得開始: ${url}`);
    
    // レート制限の実装
    await this.enforceRateLimit(finalConfig.requestDelay);
    
    // キャッシュチェック
    const cachedPage = this.pageCache.get(url);
    if (cachedPage && this.isCacheValid(cachedPage)) {
      console.log(`💾 キャッシュから取得: ${url}`);
      return cachedPage.content;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        console.log(`🔄 取得試行 ${attempt}/${finalConfig.maxRetries}: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
        
        const headers: Record<string, string> = {
          'User-Agent': finalConfig.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        };

        // If-Modified-Since ヘッダーの追加
        if (cachedPage?.lastModified) {
          headers['If-Modified-Since'] = cachedPage.lastModified;
        }

        // ETag ヘッダーの追加
        if (cachedPage?.etag) {
          headers['If-None-Match'] = cachedPage.etag;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // 304 Not Modified の場合、キャッシュを更新して返す
        if (response.status === 304 && cachedPage) {
          console.log(`📄 コンテンツ未変更: ${url}`);
          cachedPage.lastChecked = new Date();
          return cachedPage.content;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();
        
        // キャッシュに保存
        const lastModified = response.headers.get('Last-Modified') || new Date().toUTCString();
        const etag = response.headers.get('ETag') || undefined;
        
        this.pageCache.set(url, {
          url,
          content,
          lastModified,
          etag,
          lastChecked: new Date()
        });

        console.log(`✅ ページ取得成功: ${url} (${content.length} bytes)`);
        return content;

      } catch (error) {
        console.error(`❌ 取得エラー (試行 ${attempt}): ${error}`);
        lastError = error as Error;
        
        if (attempt < finalConfig.maxRetries) {
          console.log(`⏳ ${finalConfig.retryDelay}ms 待機後に再試行...`);
          await this.delay(finalConfig.retryDelay);
        }
      }
    }

    throw new Error(`${finalConfig.maxRetries}回の試行後に失敗: ${lastError?.message}`);
  }

  private static async enforceRateLimit(delay: number): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < delay) {
      const waitTime = delay - timeSinceLastRequest;
      console.log(`⏳ レート制限: ${waitTime}ms 待機`);
      await this.delay(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  private static isCacheValid(cachedPage: CachedPage): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - cachedPage.lastChecked.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24時間
    
    return cacheAge < maxAge;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static clearCache(): void {
    this.pageCache.clear();
    console.log('🧹 ページキャッシュをクリアしました');
  }

  static getCacheSize(): number {
    return this.pageCache.size;
  }

  static getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.pageCache.size,
      urls: Array.from(this.pageCache.keys())
    };
  }
}
