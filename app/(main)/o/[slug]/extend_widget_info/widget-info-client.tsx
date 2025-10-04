"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface WidgetInfoClientProps {
  chatbotUrl: string;
  tenant: {
    name: string;
    slug: string;
    welcomeMessage: string | null;
    question1: string | null;
    question2: string | null;
    question3: string | null;
  };
}

export default function WidgetInfoClient({ chatbotUrl, tenant }: WidgetInfoClientProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const iframeCode = `<iframe 
  src="${chatbotUrl}" 
  style="width: 100%; height: 100%; min-height: 700px" 
  frameborder="0" 
  allow="microphone">
</iframe>`;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Widget 嵌入信息</h1>
        <p className="text-gray-600">将你的聊天机器人嵌入到任何网页或通过Chrome扩展使用</p>
      </div>

      {/* Chatbot URL */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Chatbot URL
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <code className="text-sm break-all">{chatbotUrl}</code>
        </div>
        <button
          onClick={() => handleCopy(chatbotUrl, "url")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Copy className="w-4 h-4" />
          {copied === "url" ? "已复制!" : "复制URL"}
        </button>
        <a
          href={chatbotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 ml-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          预览
        </a>
      </div>

      {/* iframe嵌入代码 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">方式一：iframe 嵌入</h2>
        <p className="text-gray-600 mb-4">将以下代码复制到你的网页中：</p>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 overflow-x-auto">
          <pre className="text-sm">
            <code>{iframeCode}</code>
          </pre>
        </div>
        <button
          onClick={() => handleCopy(iframeCode.replace(/\n/g, " ").replace(/\s+/g, " "), "iframe")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Copy className="w-4 h-4" />
          {copied === "iframe" ? "已复制!" : "复制代码"}
        </button>
      </div>

      {/* Chrome扩展说明 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">方式二：Chrome 浏览器扩展</h2>
        <p className="text-gray-600 mb-4">使用Chrome扩展在任何网页上显示聊天机器人：</p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>安装Chrome扩展（见项目的 extensions 目录）</li>
          <li>点击扩展图标打开设置</li>
          <li>输入上面的Chatbot URL</li>
          <li>开启&quot;Enable on all pages&quot;</li>
          <li>点击保存</li>
        </ol>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>提示：</strong> 扩展安装方法请参考项目中的{" "}
            <code className="bg-blue-100 px-2 py-1 rounded">extensions/README.md</code> 文件
          </p>
        </div>
      </div>

      {/* 配置信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">当前配置</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">组织名称：</span>
            <span className="font-medium">{tenant.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Slug：</span>
            <span className="font-medium">{tenant.slug}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">欢迎消息：</span>
            <span className="font-medium">{tenant.welcomeMessage || "未设置"}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">快捷问题1：</span>
            <span className="font-medium">{tenant.question1 || "未设置"}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">快捷问题2：</span>
            <span className="font-medium">{tenant.question2 || "未设置"}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">快捷问题3：</span>
            <span className="font-medium">{tenant.question3 || "未设置"}</span>
          </div>
        </div>
        <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>提示：</strong> 可以在设置页面修改欢迎消息和快捷问题，以提供更好的用户体验
          </p>
        </div>
      </div>
    </div>
  );
}
