
# クソサイト・スカウター

企業のウェブサイト品質を分析し、ビジネスチャンスを発見するためのアプリケーションです。

## プロジェクト情報

**URL**: ローカル開発環境で実行中

## コードの編集方法

このアプリケーションを編集する方法はいくつかあります。

**Lovableを使用**

ローカル開発サーバーを起動して、プロンプトを入力してください。

Lovableで行った変更は、このリポジトリに自動的にコミットされます。

**お好みのIDEを使用**

ローカル環境でお好みのIDEを使用したい場合は、このリポジトリをクローンして変更をプッシュできます。プッシュされた変更もLovableに反映されます。

必要な要件はNode.jsとnpmのインストールのみです - [nvmでインストール](https://github.com/nvm-sh/nvm#installing-and-updating)

以下の手順に従ってください：

```sh
# ステップ1: プロジェクトのGit URLを使用してリポジトリをクローンします。
git clone <YOUR_GIT_URL>

# ステップ2: プロジェクトディレクトリに移動します。
cd <YOUR_PROJECT_NAME>

# ステップ3: 必要な依存関係をインストールします。
npm i

# ステップ4: 自動リロードとインスタントプレビュー付きの開発サーバーを起動します。
npm run dev
```

**GitHubで直接ファイルを編集**

- 編集したいファイルに移動します。
- ファイルビューの右上にある「Edit」ボタン（鉛筆アイコン）をクリックします。
- 変更を行い、変更をコミットします。

**GitHub Codespacesを使用**

- リポジトリのメインページに移動します。
- 右上の「Code」ボタン（緑色のボタン）をクリックします。
- 「Codespaces」タブを選択します。
- 「New codespace」をクリックして新しいCodespace環境を起動します。
- Codespace内で直接ファイルを編集し、完了したら変更をコミットしてプッシュします。

## このプロジェクトで使用されている技術

このプロジェクトは以下の技術で構築されています：

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## プロジェクトのデプロイ方法



## カスタムドメインの接続

はい、可能です！

ドメインを接続するには、プロジェクト > 設定 > ドメインに移動し、「ドメインを接続」をクリックします。



## 機能

- 企業ウェブサイトの品質分析
- ダッシュボードでの統計表示
- 企業データの管理とフィルタリング
- レポート生成機能
- データソースの管理
- ユーザー認証とアカウント管理

## 分析項目

- 全体スコア
- 技術スコア（ページ速度、SSL証明書など）
- コンテンツスコア
- ユーザーエクスペリエンススコア
- SEOスコア
- E-E-A-T（専門性、権威性、信頼性）評価
