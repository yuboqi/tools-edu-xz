import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Head>
        <title>体育工具系统</title>
        <meta name="description" content="集成化的体育比赛与数据管理工具平台" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navbar />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-5 py-10">
          {/* 头部 */}
          <header className="text-center mb-16 text-white">
            <h1 className="text-5xl font-bold mb-4 text-shadow">
              🏃‍♂️ 体育工具系统
            </h1>
            <p className="text-xl opacity-90 font-light">
              为小张服务的体育比赛与数据管理工具集
            </p>
          </header>

          {/* 工具卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Link
              href="/scoring"
              className="bg-white rounded-2xl p-10 text-center shadow-xl transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl group cursor-pointer"
            >
              <div className="text-7xl mb-5 group-hover:scale-110 transition-transform duration-300">
                🏃‍♂️
              </div>
              <h3 className="text-gray-800 text-2xl font-semibold mb-4">
                弯道跑计分系统
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                简单、准确、易用的比赛计分工具
              </p>
              <button className="bg-primary-500 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                开始使用
              </button>
            </Link>

            <Link
              href="/compare"
              className="bg-white rounded-2xl p-10 text-center shadow-xl transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl group cursor-pointer"
            >
              <div className="text-7xl mb-5 group-hover:scale-110 transition-transform duration-300">
                📊
              </div>
              <h3 className="text-gray-800 text-2xl font-semibold mb-4">
                体测数据对比
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                可视化体测数据对比分析工具
              </p>
              <button className="bg-primary-500 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                开始使用
              </button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
