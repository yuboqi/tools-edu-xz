import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";

// 动态导入 ECharts,避免 SSR 问题
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// 定义类型
interface ProjectData {
  name: string;
  data: number[];
}

interface Workspace {
  id: string;
  name: string;
  title: string;
  projectData: ProjectData[];
  seriesNames: string[];
}

export default function ComparePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Modal状态
  const [showAddWorkspaceModal, setShowAddWorkspaceModal] = useState(false);
  const [showDeleteWorkspaceModal, setShowDeleteWorkspaceModal] =
    useState(false);
  const [showRenameWorkspaceModal, setShowRenameWorkspaceModal] =
    useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState("");
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(
    null
  );
  const [renamingWorkspaceId, setRenamingWorkspaceId] = useState<string | null>(
    null
  );

  const chartRef = useRef<any>(null);
  const chartInstanceRef = useRef<any>(null);

  // 初始化
  useEffect(() => {
    loadData();
  }, []);

  // 自动保存
  useEffect(() => {
    if (typeof window !== "undefined" && workspaces.length > 0) {
      saveData();
    }
  }, [workspaces, currentWorkspaceId]);

  const loadData = () => {
    if (typeof window === "undefined") return;

    try {
      const savedData = localStorage.getItem("compareSystemData");
      if (savedData) {
        const data = JSON.parse(savedData);
        setWorkspaces(data.workspaces || []);
        setCurrentWorkspaceId(data.currentWorkspaceId || null);

        if (data.workspaces.length === 0) {
          createDefaultWorkspace();
        }
      } else {
        createDefaultWorkspace();
      }
    } catch (error) {
      console.error("数据加载失败:", error);
      createDefaultWorkspace();
    }
    setHasUnsavedChanges(false);
  };

  const createDefaultWorkspace = () => {
    const workspace: Workspace = {
      id: generateId(),
      name: "2301班2024与2025体测数据对比",
      title: "2301班2024与2025体测数据对比",
      projectData: [
        { name: "肺活量", data: [18, 11, 12, 11, 13, 15] },
        { name: "50米", data: [3, 4, 33, 7, 14, 18] },
        { name: "坐位体前屈", data: [5, 8, 28, 8, 14, 17] },
        { name: "一分钟跳绳", data: [31, 8, 1, 37, 1, 1] },
        { name: "一分钟仰卧起坐", data: [0, 0, 0, 15, 9, 15] },
      ],
      seriesNames: [
        "2024优秀",
        "2024良好",
        "2024及格",
        "2025优秀",
        "2025良好",
        "2025及格",
      ],
    };
    setWorkspaces([workspace]);
    setCurrentWorkspaceId(workspace.id);
  };

  const generateId = () => {
    return "ws_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  };

  const saveData = () => {
    if (typeof window === "undefined") return;

    try {
      const data = {
        workspaces,
        currentWorkspaceId,
        savedTime: new Date().toLocaleString(),
      };
      localStorage.setItem("compareSystemData", JSON.stringify(data));
      setHasUnsavedChanges(false);
      showMessage("数据保存成功！", "success");
    } catch (error) {
      console.error("数据保存失败:", error);
      showMessage("数据保存失败", "error");
    }
  };

  const getCurrentWorkspace = (): Workspace | undefined => {
    return workspaces.find((ws) => ws.id === currentWorkspaceId);
  };

  const updateCurrentWorkspace = (updates: Partial<Workspace>) => {
    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws.id === currentWorkspaceId ? { ...ws, ...updates } : ws
      )
    );
    setHasUnsavedChanges(true);
  };

  const loadWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
  };

  const addWorkspace = () => {
    if (!workspaceNameInput.trim()) {
      showMessage("请输入工作区名称！", "warning");
      return;
    }

    const newWorkspace: Workspace = {
      id: generateId(),
      name: workspaceNameInput.trim(),
      title: workspaceNameInput.trim(),
      projectData: [
        { name: "肺活量", data: [0, 0, 0, 0, 0, 0] },
        { name: "50米", data: [0, 0, 0, 0, 0, 0] },
        { name: "坐位体前屈", data: [0, 0, 0, 0, 0, 0] },
        { name: "一分钟跳绳", data: [0, 0, 0, 0, 0, 0] },
        { name: "一分钟仰卧起坐", data: [0, 0, 0, 0, 0, 0] },
      ],
      seriesNames: [
        "2024优秀",
        "2024良好",
        "2024及格",
        "2025优秀",
        "2025良好",
        "2025及格",
      ],
    };

    setWorkspaces((prev) => [...prev, newWorkspace]);
    setCurrentWorkspaceId(newWorkspace.id);
    setShowAddWorkspaceModal(false);
    setWorkspaceNameInput("");
    showMessage("工作区创建成功！", "success");
  };

  const deleteWorkspace = () => {
    if (workspaces.length <= 1) {
      showMessage("至少需要保留一个工作区！", "warning");
      return;
    }

    setWorkspaces((prev) => prev.filter((ws) => ws.id !== deletingWorkspaceId));

    if (currentWorkspaceId === deletingWorkspaceId) {
      setCurrentWorkspaceId(workspaces[0].id);
    }

    setShowDeleteWorkspaceModal(false);
    setDeletingWorkspaceId(null);
    showMessage("工作区已删除", "success");
  };

  const renameWorkspace = () => {
    if (!workspaceNameInput.trim()) {
      showMessage("请输入工作区名称！", "warning");
      return;
    }

    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws.id === renamingWorkspaceId
          ? {
              ...ws,
              name: workspaceNameInput.trim(),
              title: workspaceNameInput.trim(),
            }
          : ws
      )
    );

    setShowRenameWorkspaceModal(false);
    setRenamingWorkspaceId(null);
    setWorkspaceNameInput("");
    showMessage("工作区重命名成功！", "success");
  };

  const addProject = () => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    const newData = new Array(workspace.seriesNames.length).fill(0);
    updateCurrentWorkspace({
      projectData: [
        ...workspace.projectData,
        { name: "新项目", data: newData },
      ],
    });
  };

  const addSeries = () => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    const newSeriesName = prompt(
      "请输入新系列名称（例如：2024不及格）:",
      "2024不及格"
    );
    if (newSeriesName && newSeriesName.trim()) {
      updateCurrentWorkspace({
        seriesNames: [...workspace.seriesNames, newSeriesName.trim()],
        projectData: workspace.projectData.map((proj) => ({
          ...proj,
          data: [...proj.data, 0],
        })),
      });
    }
  };

  const deleteProject = (index: number) => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    updateCurrentWorkspace({
      projectData: workspace.projectData.filter((_, i) => i !== index),
    });
  };

  const deleteSeries = (index: number) => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    updateCurrentWorkspace({
      seriesNames: workspace.seriesNames.filter((_, i) => i !== index),
      projectData: workspace.projectData.map((proj) => ({
        ...proj,
        data: proj.data.filter((_, i) => i !== index),
      })),
    });
  };

  const updateProjectName = (index: number, name: string) => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    const newProjectData = [...workspace.projectData];
    newProjectData[index] = { ...newProjectData[index], name };
    updateCurrentWorkspace({ projectData: newProjectData });
  };

  const updateProjectData = (
    rowIndex: number,
    colIndex: number,
    value: number
  ) => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    const newProjectData = [...workspace.projectData];
    newProjectData[rowIndex] = {
      ...newProjectData[rowIndex],
      data: newProjectData[rowIndex].data.map((v, i) =>
        i === colIndex ? value : v
      ),
    };
    updateCurrentWorkspace({ projectData: newProjectData });
  };

  const updateSeriesName = (index: number, name: string) => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    const newSeriesNames = [...workspace.seriesNames];
    newSeriesNames[index] = name;
    updateCurrentWorkspace({ seriesNames: newSeriesNames });
  };

  const updateTitle = (title: string) => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    updateCurrentWorkspace({ title, name: title });
  };

  const exportData = () => {
    try {
      const data = {
        workspaces,
        currentWorkspaceId,
        exportTime: new Date().toLocaleString(),
        version: "1.0",
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `体测数据_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showMessage("数据导出成功！", "success");
    } catch (error) {
      console.error("导出失败:", error);
      showMessage("数据导出失败", "error");
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.workspaces || !Array.isArray(data.workspaces)) {
          throw new Error("数据格式不正确");
        }

        if (confirm("导入数据将覆盖当前所有工作区，确定要继续吗？")) {
          setWorkspaces(data.workspaces);
          setCurrentWorkspaceId(
            data.currentWorkspaceId || data.workspaces[0].id
          );
          showMessage("数据导入成功！", "success");
        }
      } catch (error) {
        console.error("导入失败:", error);
        showMessage("数据导入失败", "error");
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  };

  const exportImage = () => {
    if (chartInstanceRef.current) {
      const chart = chartInstanceRef.current;
      const img = chart.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const workspace = getCurrentWorkspace();
      link.href = img;
      link.download = (workspace?.title || "图表") + ".png";
      link.click();
      showMessage("图片导出成功！", "success");
    }
  };

  const showMessage = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    if (typeof window === "undefined") return;

    const colors = {
      success: "#38a169",
      error: "#e53e3e",
      warning: "#d69e2e",
      info: "#3182ce",
    };

    const toast = document.createElement("div");
    toast.className =
      "fixed top-20 right-5 text-white px-5 py-4 rounded-lg shadow-lg z-50 animate-slide-in font-medium";
    toast.style.backgroundColor = colors[type];
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
  };

  // 图表配置
  const getChartOption = () => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return {};

    const colors = [
      "#5470C6",
      "#91CC75",
      "#FAC858",
      "#EE6666",
      "#73C0DE",
      "#3BA272",
      "#FC8452",
      "#9A60B4",
      "#EA7CCC",
      "#FF9F7F",
      "#FFDB5C",
      "#37A2DA",
    ];

    return {
      title: {
        text: workspace.title,
        left: "center",
        top: 10,
        textStyle: { fontSize: 22, fontWeight: "bold" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {
        top: 50,
        data: workspace.seriesNames,
      },
      grid: {
        left: "5%",
        right: "5%",
        bottom: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: workspace.projectData.map((p) => p.name),
        axisLabel: {
          fontSize: 14,
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        name: "人数（人）",
        nameTextStyle: { fontSize: 14 },
      },
      dataZoom: [
        { type: "slider", show: true, xAxisIndex: 0, start: 0, end: 100 },
        { type: "inside", xAxisIndex: 0 },
      ],
      series: workspace.seriesNames.map((name, i) => ({
        name,
        type: "bar",
        data: workspace.projectData.map((p) =>
          p.data[i] !== undefined ? p.data[i] : 0
        ),
        itemStyle: { color: colors[i % colors.length] },
        label: { show: true, position: "top", fontSize: 12 },
      })),
    };
  };

  const workspace = getCurrentWorkspace();

  // 拖拽处理
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const workspace = getCurrentWorkspace();
    if (!workspace) return;

    const newProjectData = [...workspace.projectData];
    const temp = newProjectData[draggedIndex];
    newProjectData[draggedIndex] = newProjectData[dropIndex];
    newProjectData[dropIndex] = temp;

    updateCurrentWorkspace({ projectData: newProjectData });
    setDraggedIndex(null);
  };

  return (
    <>
      <Head>
        <title>体测数据对比 - 体育工具系统</title>
        <meta name="description" content="可视化体测数据对比分析工具" />
      </Head>
      <Navbar />
      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-5">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-gray-700 text-3xl font-semibold text-center mb-5">
              体测数据对比管理
            </h2>

            {/* 顶部工具栏 */}
            <div className="flex flex-wrap justify-between items-center p-4 bg-gradient-primary rounded-lg mb-5 shadow-md gap-2">
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={saveData}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                >
                  💾 保存进度
                </button>
                <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer">
                  📥 导入数据
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={exportData}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                >
                  📤 导出数据
                </button>
              </div>
              <div className="flex items-center">
                <span
                  className={`px-3 py-1.5 rounded-md text-sm font-medium text-white ${
                    hasUnsavedChanges
                      ? "bg-orange-500/30 animate-pulse"
                      : "bg-green-600/30"
                  }`}
                >
                  {hasUnsavedChanges ? "未保存 *" : "已保存"}
                </span>
              </div>
            </div>

            {/* 工作区标签栏 */}
            <div className="flex items-center gap-2.5 mb-5 p-2.5 bg-gray-50 rounded-lg border-2 border-gray-200 overflow-x-auto">
              <div className="flex gap-1.5 flex-1 overflow-x-auto">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => loadWorkspace(ws.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all duration-300 whitespace-nowrap min-w-[100px] max-w-[200px] ${
                      ws.id === currentWorkspaceId
                        ? "bg-gradient-primary text-white shadow-md"
                        : "bg-white border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                    title={ws.name}
                  >
                    <span
                      className="flex-1 overflow-hidden text-ellipsis font-medium select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setRenamingWorkspaceId(ws.id);
                        setWorkspaceNameInput(ws.name);
                        setShowRenameWorkspaceModal(true);
                      }}
                    >
                      {ws.name}
                    </span>
                    {workspaces.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingWorkspaceId(ws.id);
                          setShowDeleteWorkspaceModal(true);
                        }}
                        className={`px-1.5 py-0.5 rounded transition-all duration-200 ${
                          ws.id === currentWorkspaceId
                            ? "hover:bg-white/20 text-white"
                            : "hover:bg-gray-200 text-gray-600"
                        }`}
                        title="关闭工作区"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAddWorkspaceModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-md whitespace-nowrap"
                title="新建工作区"
              >
                ➕
              </button>
            </div>

            {/* 数据编辑控制栏 */}
            <div className="flex flex-wrap gap-2.5 items-center justify-center mb-5">
              <label className="font-medium text-gray-700">
                图表标题：
                <input
                  type="text"
                  value={workspace?.title || ""}
                  onChange={(e) => updateTitle(e.target.value)}
                  className="ml-2 px-3 py-2 text-sm border-2 border-gray-200 rounded-md transition-all duration-300 focus:outline-none focus:border-primary-500 w-80"
                />
              </label>
              <button
                onClick={addProject}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                ➕ 添加项目
              </button>
              <button
                onClick={addSeries}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                ➕ 添加系列
              </button>
              <button
                onClick={exportImage}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                📤 导出图片
              </button>
            </div>

            {/* 数据表格 */}
            {workspace && (
              <div className="overflow-x-auto mb-5">
                <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2.5 text-center text-gray-800 font-semibold w-12">
                        排序
                      </th>
                      <th className="border border-gray-200 p-2.5 text-center text-gray-800 font-semibold">
                        项目名称
                      </th>
                      {workspace.seriesNames.map((name, i) => (
                        <th
                          key={i}
                          className="border border-gray-200 p-2.5 text-center text-gray-800 font-semibold"
                        >
                          <input
                            type="text"
                            value={name}
                            onChange={(e) =>
                              updateSeriesName(i, e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm font-bold border border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none rounded text-center transition-all duration-300"
                          />
                          <button
                            onClick={() => deleteSeries(i)}
                            className="mt-1 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-all duration-300"
                          >
                            🗑️
                          </button>
                        </th>
                      ))}
                      <th className="border border-gray-200 p-2.5 text-center text-gray-800 font-semibold w-20">
                        删除
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspace.projectData.map((proj, i) => (
                      <tr
                        key={i}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={(e) => handleDrop(e, i)}
                        className={`transition-colors duration-200 hover:bg-gray-50 ${
                          draggedIndex === i ? "opacity-50 bg-gray-200" : ""
                        }`}
                      >
                        <td className="border border-gray-200 p-2 text-center cursor-grab active:cursor-grabbing text-lg text-gray-400 hover:text-primary-500 select-none">
                          ☰
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) =>
                              updateProjectName(i, e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 text-sm border border-transparent hover:border-gray-300 hover:bg-gray-50 focus:border-primary-500 focus:bg-white focus:outline-none rounded text-center transition-all duration-300"
                          />
                        </td>
                        {proj.data.map((value, j) => (
                          <td
                            key={j}
                            className="border border-gray-200 p-2 text-center"
                          >
                            <input
                              type="number"
                              value={value}
                              onChange={(e) =>
                                updateProjectData(i, j, Number(e.target.value))
                              }
                              className="w-full px-2.5 py-1.5 text-sm border border-transparent hover:border-gray-300 hover:bg-gray-50 focus:border-primary-500 focus:bg-white focus:outline-none rounded text-center transition-all duration-300"
                            />
                          </td>
                        ))}
                        <td className="border border-gray-200 p-2 text-center">
                          <button
                            onClick={() => deleteProject(i)}
                            className="px-2.5 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-all duration-300"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 图表 */}
            {workspace && (
              <div className="bg-white rounded-lg">
                <ReactECharts
                  onChartReady={(chartInstance) => {
                    chartInstanceRef.current = chartInstance;
                  }}
                  option={getChartOption()}
                  style={{ height: "600px", width: "100%" }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 新建工作区 Modal */}
      {showAddWorkspaceModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddWorkspaceModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-11/12 animate-slide-up">
            <h3 className="text-gray-800 text-2xl font-semibold mb-4 text-center">
              📝 新建工作区
            </h3>
            <p className="text-gray-600 mb-5 text-center">
              请输入新工作区的名称：
            </p>
            <input
              type="text"
              value={workspaceNameInput}
              onChange={(e) => setWorkspaceNameInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") addWorkspace();
              }}
              placeholder="例如：2302班数据对比"
              maxLength={50}
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg mb-5 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:shadow-lg"
              autoFocus
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={addWorkspace}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                确认
              </button>
              <button
                onClick={() => {
                  setShowAddWorkspaceModal(false);
                  setWorkspaceNameInput("");
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除工作区 Modal */}
      {showDeleteWorkspaceModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteWorkspaceModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-11/12 text-center animate-slide-up">
            <h3 className="text-gray-800 text-2xl font-semibold mb-4">
              ⚠️ 确认删除
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              确定要删除工作区
              <br />
              <strong>
                "{workspaces.find((ws) => ws.id === deletingWorkspaceId)?.name}"
              </strong>
              吗？
              <br />
              此操作不可恢复。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={deleteWorkspace}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                确认删除
              </button>
              <button
                onClick={() => {
                  setShowDeleteWorkspaceModal(false);
                  setDeletingWorkspaceId(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名工作区 Modal */}
      {showRenameWorkspaceModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRenameWorkspaceModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-11/12 animate-slide-up">
            <h3 className="text-gray-800 text-2xl font-semibold mb-4 text-center">
              ✏️ 重命名工作区
            </h3>
            <p className="text-gray-600 mb-5 text-center">请输入新名称：</p>
            <input
              type="text"
              value={workspaceNameInput}
              onChange={(e) => setWorkspaceNameInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") renameWorkspace();
              }}
              placeholder="输入新名称"
              maxLength={50}
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg mb-5 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:shadow-lg"
              autoFocus
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={renameWorkspace}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                确认
              </button>
              <button
                onClick={() => {
                  setShowRenameWorkspaceModal(false);
                  setRenamingWorkspaceId(null);
                  setWorkspaceNameInput("");
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
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
