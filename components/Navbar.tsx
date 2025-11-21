import Link from "next/link";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-md z-50">
      <div className="max-w-7xl mx-auto px-5 flex justify-between items-center h-16">
        <Link
          href="/"
          className="text-2xl font-bold text-primary-500 hover:text-primary-600 transition-all duration-300 hover:scale-105"
        >
          🏃‍♂️ 体育工具系统
        </Link>
        <div className="flex gap-2.5">
          <Link
            href="/scoring"
            className={`px-5 py-2 rounded-full font-medium transition-all duration-300 ${
              isActive("/scoring")
                ? "bg-primary-500 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-primary-500"
            }`}
          >
            弯道跑计分
          </Link>
          <Link
            href="/compare"
            className={`px-5 py-2 rounded-full font-medium transition-all duration-300 ${
              isActive("/compare")
                ? "bg-primary-500 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-primary-500"
            }`}
          >
            体测数据对比
          </Link>
        </div>
      </div>
    </nav>
  );
}
