import { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "@/components/Navbar";

// 定义类型
interface TotalScores {
  [key: string]: number;
}

interface CurrentRoundData {
  [key: string]: number | null;
}

interface RoundRecord {
  round: number;
  scores: {
    [key: string]: {
      rank: number;
      score: number;
    };
  };
  timestamp: string;
}

export default function ScoringPage() {
  // 计分规则
  const scoreMap: { [key: number]: number } = { 1: 4, 2: 3, 3: 2, 4: 1 };

  // 状态管理
  const [groups, setGroups] = useState<string[]>(["A", "B", "C", "D"]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalScores, setTotalScores] = useState<TotalScores>({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  });
  const [currentRoundData, setCurrentRoundData] = useState<CurrentRoundData>(
    {}
  );
  const [isRoundInProgress, setIsRoundInProgress] = useState(true);
  const [roundHistory, setRoundHistory] = useState<RoundRecord[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 自动保存数据（只在数据加载完成后）
  useEffect(() => {
    if (typeof window !== "undefined" && isDataLoaded) {
      saveData();
    }
  }, [
    groups,
    currentRound,
    totalScores,
    currentRoundData,
    isRoundInProgress,
    roundHistory,
    isDataLoaded,
  ]);

  // 页面刷新前保存数据
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveData();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    groups,
    currentRound,
    totalScores,
    currentRoundData,
    isRoundInProgress,
    roundHistory,
  ]);

  const loadData = () => {
    if (typeof window === "undefined") return;

    try {
      const savedData = localStorage.getItem("scoringSystemData");
      if (savedData) {
        const data = JSON.parse(savedData);
        setGroups(data.groups || ["A", "B", "C", "D"]);
        setCurrentRound(data.currentRound || 1);
        setRoundHistory(data.roundHistory || []);
        setTotalScores(data.totalScores || { A: 0, B: 0, C: 0, D: 0 });
        setIsRoundInProgress(
          data.isRoundInProgress !== undefined ? data.isRoundInProgress : true
        );
        setCurrentRoundData(data.currentRoundData || {});
        console.log("数据加载成功:", data);
      }
    } catch (error) {
      console.error("数据加载失败:", error);
    } finally {
      // 标记数据已加载完成
      setIsDataLoaded(true);
    }
  };

  const saveData = () => {
    if (typeof window === "undefined") return;

    try {
      const data = {
        groups,
        currentRound,
        roundHistory,
        totalScores,
        isRoundInProgress,
        currentRoundData,
      };
      localStorage.setItem("scoringSystemData", JSON.stringify(data));
      console.log("数据保存成功:", data);
    } catch (error) {
      console.error("数据保存失败:", error);
    }
  };

  const startNewRound = () => {
    setIsRoundInProgress(true);
    const newData: CurrentRoundData = {};
    groups.forEach((group) => {
      newData[group] = null;
    });
    setCurrentRoundData(newData);
  };

  const setParticipantRank = (group: string, rank: number) => {
    setCurrentRoundData((prev) => ({
      ...prev,
      [group]: rank,
    }));
  };

  const submitRound = () => {
    const hasAllScores = groups.every(
      (group) =>
        currentRoundData[group] !== null &&
        currentRoundData[group] !== undefined
    );

    if (!hasAllScores) {
      alert("请为所有参赛组别选择名次！");
      return;
    }

    const roundScores: any = {};
    const newTotalScores = { ...totalScores };

    groups.forEach((group) => {
      const rank = currentRoundData[group] as number;
      const score = scoreMap[rank];
      roundScores[group] = { rank, score };
      newTotalScores[group] += score;
    });

    setTotalScores(newTotalScores);
    setRoundHistory((prev) => [
      ...prev,
      {
        round: currentRound,
        scores: roundScores,
        timestamp: new Date().toLocaleString(),
      },
    ]);
    setCurrentRound((prev) => prev + 1);
    setIsRoundInProgress(false);
    setCurrentRoundData({});
    showSuccessMessage(`第${currentRound}轮成绩已记录！`);
  };

  const confirmReset = () => {
    setGroups(["A", "B", "C", "D"]);
    setCurrentRound(1);
    setRoundHistory([]);
    setTotalScores({ A: 0, B: 0, C: 0, D: 0 });
    setCurrentRoundData({});
    setIsRoundInProgress(true);
    setShowResetModal(false);
    showSuccessMessage("所有数据已重置！");
  };

  const showSuccessMessage = (message: string) => {
    // 创建toast提示
    if (typeof window !== "undefined") {
      const toast = document.createElement("div");
      toast.className =
        "fixed top-20 right-5 bg-green-600 text-white px-5 py-4 rounded-lg shadow-lg z-50 animate-slide-in";
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease-out reverse";
        setTimeout(() => {
          if (toast.parentNode) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }
  };

  const exportToExcel = (type: string) => {
    let data: any[][] = [];
    let filename = "";

    if (type === "总分排行榜") {
      const sortedGroups = [...groups].sort((a, b) => {
        const scoreA = totalScores[a] || 0;
        const scoreB = totalScores[b] || 0;
        if (scoreB === scoreA) {
          return a.localeCompare(b);
        }
        return scoreB - scoreA;
      });

      let currentRank = 1;
      const groupRanks: { [key: string]: number } = {};

      for (let i = 0; i < sortedGroups.length; i++) {
        const group = sortedGroups[i];
        const score = totalScores[group] || 0;

        if (i > 0) {
          const prevGroup = sortedGroups[i - 1];
          const prevScore = totalScores[prevGroup] || 0;
          if (score < prevScore) {
            currentRank = i + 1;
          }
        }

        groupRanks[group] = currentRank;
      }

      data = [
        ["排名", "组别", "总分"],
        ...sortedGroups.map((group) => [
          groupRanks[group],
          group,
          totalScores[group] || 0,
        ]),
      ];
      filename = "弯道跑总分排行榜";
    } else if (type === "比赛历史") {
      data = [["轮次", "时间", "组别", "名次", "得分"]];

      roundHistory.forEach((record) => {
        Object.entries(record.scores).forEach(([group, scoreData]) => {
          data.push([
            record.round,
            record.timestamp,
            group,
            scoreData.rank,
            scoreData.score,
          ]);
        });
      });
      filename = "弯道跑比赛历史";
    }

    downloadExcel(data, filename);
  };

  const downloadExcel = (data: any[][], filename: string) => {
    const csvContent = data
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showSuccessMessage(`${filename}已导出成功！`);
  };

  // 渲染排行榜
  const renderScoreboard = () => {
    const sortedGroups = [...groups].sort((a, b) => {
      const scoreA = totalScores[a] || 0;
      const scoreB = totalScores[b] || 0;
      if (scoreB === scoreA) {
        return a.localeCompare(b);
      }
      return scoreB - scoreA;
    });

    let currentRank = 1;
    const groupRanks: { [key: string]: number } = {};

    for (let i = 0; i < sortedGroups.length; i++) {
      const group = sortedGroups[i];
      const score = totalScores[group] || 0;

      if (i > 0) {
        const prevGroup = sortedGroups[i - 1];
        const prevScore = totalScores[prevGroup] || 0;
        if (score < prevScore) {
          currentRank = i + 1;
        }
      }

      groupRanks[group] = currentRank;
    }

    const getRankText = (rank: number) => {
      const rankTexts: { [key: number]: string } = {
        1: "🥇 第一名",
        2: "🥈 第二名",
        3: "🥉 第三名",
      };
      return rankTexts[rank] || `第${rank}名`;
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        {sortedGroups.map((group) => (
          <div
            key={group}
            className="bg-white/20 backdrop-blur-md rounded-xl p-5 text-center transition-transform duration-300 hover:scale-105"
          >
            <div className="text-2xl font-bold mb-1">组别 {group}</div>
            <div className="text-4xl font-bold text-yellow-300 drop-shadow-lg">
              {totalScores[group] || 0}
            </div>
            <div className="text-sm opacity-80 mt-1">
              {getRankText(groupRanks[group])}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>弯道跑计分系统 - 体育工具系统</title>
        <meta name="description" content="简单、准确、易用的比赛计分工具" />
      </Head>
      <Navbar />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-5">
          {/* 头部 */}
          <header className="text-center mb-10 text-white">
            <h1 className="text-4xl font-bold mb-2 text-shadow">
              🏃‍♂️ 弯道跑计分系统
            </h1>
            <p className="text-lg opacity-90 font-light">
              简单、准确、易用的比赛计分工具
            </p>
          </header>

          {/* 总分排行榜 */}
          <section className="bg-gradient-pink rounded-xl p-6 mb-6 shadow-xl">
            <div className="flex justify-between items-center mb-5 border-b border-white/30 pb-3">
              <h2 className="text-white text-2xl font-semibold">
                📊 总分排行榜
              </h2>
              <button
                onClick={() => exportToExcel("总分排行榜")}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              >
                📊 导出Excel
              </button>
            </div>
            {renderScoreboard()}
          </section>

          {/* 当前轮次 */}
          <section className="bg-white rounded-xl p-6 mb-6 shadow-xl border-l-4 border-blue-500">
            <h2 className="text-gray-700 text-2xl font-semibold mb-5">
              {isRoundInProgress
                ? `第${currentRound}轮比赛进行中`
                : `准备开始第${currentRound}轮比赛`}
            </h2>
            {isRoundInProgress ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {groups.map((group) => (
                  <div
                    key={group}
                    className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-500 transition-all duration-300"
                  >
                    <h3 className="text-gray-800 text-xl font-semibold text-center mb-2">
                      组别 {group}
                      {currentRoundData[group] !== null &&
                        currentRoundData[group] !== undefined &&
                        ` (已获得${
                          scoreMap[currentRoundData[group] as number]
                        }分)`}
                    </h3>
                    <p className="text-center text-gray-600 text-sm font-medium mb-3">
                      选择名次（点击下方数字）：
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4].map((rank) => {
                        const isSelected = currentRoundData[group] === rank;
                        const rankColors = {
                          1: isSelected
                            ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-black"
                            : "bg-white border-2 border-gray-300",
                          2: isSelected
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 text-black"
                            : "bg-white border-2 border-gray-300",
                          3: isSelected
                            ? "bg-gradient-to-br from-orange-700 to-amber-800 text-white"
                            : "bg-white border-2 border-gray-300",
                          4: isSelected
                            ? "bg-gradient-to-br from-gray-600 to-gray-800 text-white"
                            : "bg-white border-2 border-gray-300",
                        };

                        return (
                          <button
                            key={rank}
                            onClick={() => setParticipantRank(group, rank)}
                            className={`flex-1 min-w-[45px] max-w-[60px] px-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 ${
                              rankColors[rank as keyof typeof rankColors]
                            } ${
                              isSelected ? "shadow-lg -translate-y-0.5" : ""
                            }`}
                            title={`第${rank}名 - ${scoreMap[rank]}分`}
                          >
                            第{rank}名
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 italic py-10 bg-gray-50 rounded-lg">
                点击"开始新一轮"按钮开始比赛
              </p>
            )}
          </section>

          {/* 操作按钮 */}
          <section className="bg-white rounded-xl p-6 mb-6 shadow-xl text-center">
            <div className="flex flex-wrap justify-center gap-3">
              {!isRoundInProgress && (
                <button
                  onClick={startNewRound}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg min-w-[120px]"
                >
                  开始新一轮
                </button>
              )}
              {isRoundInProgress && (
                <button
                  onClick={submitRound}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg min-w-[120px]"
                >
                  提交本轮成绩
                </button>
              )}
              <button
                onClick={() => setShowResetModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg min-w-[120px]"
              >
                重置所有数据
              </button>
            </div>
          </section>

          {/* 历史记录 */}
          <section className="bg-white rounded-xl p-6 mb-6 shadow-xl">
            <div className="flex justify-between items-center mb-5 border-b-2 border-gray-200 pb-3">
              <h2 className="text-gray-700 text-2xl font-semibold">
                📝 比赛历史
              </h2>
              {roundHistory.length > 0 && (
                <button
                  onClick={() => exportToExcel("比赛历史")}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                >
                  📋 导出Excel
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {roundHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-5">暂无比赛记录</p>
              ) : (
                [...roundHistory].reverse().map((record, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 mb-2.5 border-l-4 border-blue-500"
                  >
                    <div className="font-bold text-gray-800 mb-2">
                      第{record.round}轮 - {record.timestamp}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {Object.entries(record.scores)
                        .sort(([, a], [, b]) => a.rank - b.rank)
                        .map(([group, data]) => (
                          <div
                            key={group}
                            className="bg-white p-2 rounded text-center"
                          >
                            {group}组: 第{data.rank}名 ({data.score}分)
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* 重置确认模态框 */}
      {showResetModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResetModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-11/12 text-center animate-slide-up">
            <h3 className="text-gray-800 text-2xl font-semibold mb-4">
              ⚠️ 确认重置
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              此操作将清空所有比赛数据，包括总分和历史记录。
              <br />
              确定要继续吗？
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={confirmReset}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                确认重置
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
