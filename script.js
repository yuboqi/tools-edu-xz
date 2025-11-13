/**
 * 弯道跑计分系统
 * 功能：管理比赛计分、历史记录、数据持久化
 */

class ScoringSystem {
  constructor() {
    // 计分规则：第1名4分，第2名3分，第3名2分，第4名1分
    this.scoreMap = { 1: 4, 2: 3, 3: 2, 4: 1 };

    // 初始化界面元素
    this.initElements();

    // 加载保存的数据（会设置默认值如果没有保存数据）
    this.loadData();

    // 绑定事件
    this.bindEvents();

    // 更新界面
    this.updateDisplay();
  }

  /**
   * 初始化DOM元素引用
   */
  initElements() {
    this.elements = {
      // 主要按钮
      startRoundBtn: document.getElementById("startRoundBtn"),
      submitRoundBtn: document.getElementById("submitRoundBtn"),
      // addGroupBtn: document.getElementById('addGroupBtn'),
      resetBtn: document.getElementById("resetBtn"),

      // 显示区域
      totalScores: document.getElementById("totalScores"),
      roundTitle: document.getElementById("roundTitle"),
      currentRoundContent: document.getElementById("currentRoundContent"),
      historyList: document.getElementById("historyList"),

      // 模态框
      addGroupModal: document.getElementById("addGroupModal"),
      resetModal: document.getElementById("resetModal"),
      newGroupName: document.getElementById("newGroupName"),
      confirmAddGroup: document.getElementById("confirmAddGroup"),
      cancelAddGroup: document.getElementById("cancelAddGroup"),
      confirmReset: document.getElementById("confirmReset"),
      cancelReset: document.getElementById("cancelReset"),
    };
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 主要功能按钮
    this.elements.startRoundBtn.addEventListener("click", () =>
      this.startNewRound()
    );
    this.elements.submitRoundBtn.addEventListener("click", () =>
      this.submitRound()
    );
    // this.elements.addGroupBtn.addEventListener('click', () => this.showAddGroupModal());
    this.elements.resetBtn.addEventListener("click", () =>
      this.showResetModal()
    );

    // 添加组别模态框
    this.elements.confirmAddGroup.addEventListener("click", () =>
      this.confirmAddGroup()
    );
    this.elements.cancelAddGroup.addEventListener("click", () =>
      this.hideAddGroupModal()
    );

    // 重置模态框
    this.elements.confirmReset.addEventListener("click", () =>
      this.confirmReset()
    );
    this.elements.cancelReset.addEventListener("click", () =>
      this.hideResetModal()
    );

    // 点击模态框背景关闭
    this.elements.addGroupModal.addEventListener("click", (e) => {
      if (e.target === this.elements.addGroupModal) {
        this.hideAddGroupModal();
      }
    });

    this.elements.resetModal.addEventListener("click", (e) => {
      if (e.target === this.elements.resetModal) {
        this.hideResetModal();
      }
    });
  }

  /**
   * 从localStorage加载数据
   */
  loadData() {
    try {
      const savedData = localStorage.getItem("scoringSystemData");
      if (savedData) {
        const data = JSON.parse(savedData);
        this.groups = data.groups || ["A", "B", "C", "D"];
        this.currentRound = data.currentRound || 1;
        this.roundHistory = data.roundHistory || [];
        this.totalScores = data.totalScores || {};
        this.isRoundInProgress =
          data.isRoundInProgress !== undefined ? data.isRoundInProgress : true; // 默认开始第一轮
        this.currentRoundData = data.currentRoundData || {};

        // 确保所有组别都有总分记录，并且是有效数字
        this.groups.forEach((group) => {
          if (
            !(group in this.totalScores) ||
            this.totalScores[group] === null ||
            this.totalScores[group] === undefined ||
            isNaN(this.totalScores[group])
          ) {
            this.totalScores[group] = 0;
          }
        });

        // 如果是第一次加载且没有历史记录，默认开始第一轮
        if (this.roundHistory.length === 0 && !this.isRoundInProgress) {
          this.isRoundInProgress = true;
          this.groups.forEach((group) => {
            this.currentRoundData[group] = null;
          });
        }

        console.log("数据加载成功", data);
      } else {
        // 如果没有保存的数据，初始化默认数据
        this.initializeData();
      }
    } catch (error) {
      console.error("数据加载失败:", error);
      this.initializeData();
    }
  }

  /**
   * 保存数据到localStorage
   */
  saveData() {
    try {
      const data = {
        groups: this.groups,
        currentRound: this.currentRound,
        roundHistory: this.roundHistory,
        totalScores: this.totalScores,
        isRoundInProgress: this.isRoundInProgress,
        currentRoundData: this.currentRoundData,
      };
      localStorage.setItem("scoringSystemData", JSON.stringify(data));
      console.log("数据保存成功", data);
    } catch (error) {
      console.error("数据保存失败:", error);
    }
  }

  /**
   * 初始化数据
   */
  initializeData() {
    this.groups = ["A", "B", "C", "D"];
    this.currentRound = 1;
    this.roundHistory = [];
    this.totalScores = { A: 0, B: 0, C: 0, D: 0 };
    this.currentRoundData = {};
    this.isRoundInProgress = true; // 默认开始第一轮比赛

    // 初始化当前轮次数据
    this.groups.forEach((group) => {
      this.currentRoundData[group] = null;
    });
  }

  /**
   * 开始新一轮比赛
   */
  startNewRound() {
    this.isRoundInProgress = true;
    this.currentRoundData = {};

    // 初始化当前轮次数据
    this.groups.forEach((group) => {
      this.currentRoundData[group] = null;
    });

    this.updateDisplay();
    this.saveData();
  }

  /**
   * 提交当前轮次成绩
   */
  submitRound() {
    // 检查是否所有组别都有成绩
    const hasAllScores = this.groups.every(
      (group) =>
        this.currentRoundData[group] !== null &&
        this.currentRoundData[group] !== undefined
    );

    if (!hasAllScores) {
      alert("请为所有参赛组别选择名次！");
      return;
    }

    // 计算并更新分数
    const roundScores = {};
    this.groups.forEach((group) => {
      const rank = this.currentRoundData[group];
      const score = this.scoreMap[rank];
      roundScores[group] = { rank, score };
      this.totalScores[group] += score;
    });

    // 保存到历史记录
    this.roundHistory.push({
      round: this.currentRound,
      scores: { ...roundScores },
      timestamp: new Date().toLocaleString(),
    });

    // 重置状态，准备下一轮
    this.currentRound++;
    this.isRoundInProgress = false;
    this.currentRoundData = {};

    this.updateDisplay();
    this.saveData();

    // 显示成功提示
    this.showSuccessMessage(`第${this.currentRound - 1}轮成绩已记录！`);
  }

  /**
   * 显示添加组别模态框
   */
  showAddGroupModal() {
    const nextGroupLetter = String.fromCharCode(65 + this.groups.length);
    this.elements.newGroupName.textContent = nextGroupLetter;
    this.elements.addGroupModal.style.display = "block";
  }

  /**
   * 隐藏添加组别模态框
   */
  hideAddGroupModal() {
    this.elements.addGroupModal.style.display = "none";
  }

  /**
   * 确认添加新组别
   */
  confirmAddGroup() {
    const newGroup = String.fromCharCode(65 + this.groups.length);
    this.groups.push(newGroup);
    this.totalScores[newGroup] = 0;

    // 如果正在进行轮次，为新组别添加记录
    if (this.isRoundInProgress) {
      this.currentRoundData[newGroup] = null;
    }

    this.hideAddGroupModal();
    this.updateDisplay();
    this.saveData();

    this.showSuccessMessage(`组别 ${newGroup} 已添加！`);
  }

  /**
   * 显示重置确认模态框
   */
  showResetModal() {
    this.elements.resetModal.style.display = "block";
  }

  /**
   * 隐藏重置确认模态框
   */
  hideResetModal() {
    this.elements.resetModal.style.display = "none";
  }

  /**
   * 确认重置所有数据
   */
  confirmReset() {
    this.initializeData();
    this.hideResetModal();
    this.updateDisplay();
    this.saveData();
    this.showSuccessMessage("所有数据已重置！");
  }

  /**
   * 设置参赛者名次
   */
  setParticipantRank(group, rank) {
    this.currentRoundData[group] = rank;
    this.updateCurrentRoundDisplay();
    this.saveData();
  }

  /**
   * 更新所有显示
   */
  updateDisplay() {
    this.updateTotalScores();
    this.updateCurrentRoundDisplay();
    this.updateHistoryDisplay();
    this.updateButtons();
  }

  /**
   * 更新总分显示
   */
  updateTotalScores() {
    // 按总分排序，同分则按组别字母排序保持一致性
    const sortedGroups = [...this.groups].sort((a, b) => {
      const scoreA = this.totalScores[a] || 0;
      const scoreB = this.totalScores[b] || 0;
      if (scoreB === scoreA) {
        return a.localeCompare(b); // 同分按字母顺序
      }
      return scoreB - scoreA;
    });

    // 计算排名，处理同分情况
    let currentRank = 1;
    const groupRanks = {};

    for (let i = 0; i < sortedGroups.length; i++) {
      const group = sortedGroups[i];
      const score = this.totalScores[group] || 0;

      if (i > 0) {
        const prevGroup = sortedGroups[i - 1];
        const prevScore = this.totalScores[prevGroup] || 0;
        if (score < prevScore) {
          currentRank = i + 1;
        }
      }

      groupRanks[group] = currentRank;
    }

    const exportBtn = `
            <button onclick="scoringSystem.exportToExcel('总分排行榜')" class="btn btn-secondary export-btn">
                📊 导出Excel
            </button>
        `;

    const html = sortedGroups
      .map((group) => {
        const score = this.totalScores[group] || 0;
        const rank = groupRanks[group];
        const rankText = this.getRankText(rank);

        return `
                <div class="score-item">
                    <div class="group-name">组别 ${group}</div>
                    <div class="total-score">${score}</div>
                    <div class="rank">${rankText}</div>
                </div>
            `;
      })
      .join("");

    this.elements.totalScores.innerHTML = html;

    // 添加导出按钮到总分区域标题旁
    const scoreboardSection = document.querySelector(".scoreboard h2");
    if (!scoreboardSection.querySelector(".export-btn")) {
      scoreboardSection.innerHTML = "📊 总分排行榜 " + exportBtn;
    }
  }

  /**
   * 获取排名文本
   */
  getRankText(rank) {
    const rankTexts = {
      1: "🥇 第一名",
      2: "🥈 第二名",
      3: "🥉 第三名",
    };
    return rankTexts[rank] || `第${rank}名`;
  }

  /**
   * 更新当前轮次显示
   */
  updateCurrentRoundDisplay() {
    if (this.isRoundInProgress) {
      this.elements.roundTitle.textContent = `第${this.currentRound}轮比赛进行中`;

      const html = `
                <div class="participant-grid">
                    ${this.groups
                      .map((group) => this.generateParticipantHTML(group))
                      .join("")}
                </div>
            `;

      this.elements.currentRoundContent.innerHTML = html;
    } else {
      this.elements.roundTitle.textContent = `准备开始第${this.currentRound}轮比赛`;
      this.elements.currentRoundContent.innerHTML = `
                <p class="round-hint">点击"开始新一轮"按钮开始比赛</p>
            `;
    }
  }

  /**
   * 生成参赛者HTML
   */
  generateParticipantHTML(group) {
    const currentRank = this.currentRoundData[group];

    // 显示已选择的分数
    const selectedScore = currentRank ? this.scoreMap[currentRank] : "";
    const selectedText = currentRank ? ` (已获得${selectedScore}分)` : "";

    return `
            <div class="participant-item">
                <h3>组别 ${group}${selectedText}</h3>
                <p class="rank-label">选择名次（点击下方数字）：</p>
                <div class="rank-selector">
                    ${[1, 2, 3, 4]
                      .map((rank) => {
                        const isSelected = currentRank === rank;
                        const rankClass = this.getRankClass(rank);
                        const score = this.scoreMap[rank];
                        return `
                            <button 
                                class="rank-btn ${rankClass} ${
                          isSelected ? "selected" : ""
                        }"
                                onclick="scoringSystem.setParticipantRank('${group}', ${rank})"
                                title="第${rank}名 - ${score}分"
                            >
                                第${rank}名
                            </button>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        `;
  }

  /**
   * 获取名次对应的CSS类
   */
  getRankClass(rank) {
    const classes = { 1: "gold", 2: "silver", 3: "bronze", 4: "fourth" };
    return classes[rank] || "";
  }

  /**
   * 更新历史记录显示
   */
  updateHistoryDisplay() {
    if (this.roundHistory.length === 0) {
      this.elements.historyList.innerHTML = `
                <p style="text-align: center; color: #718096; padding: 20px;">
                    暂无比赛记录
                </p>
            `;
      return;
    }

    const exportBtn = `
            <button onclick="scoringSystem.exportToExcel('比赛历史')" class="btn btn-secondary export-btn">
                📋 导出Excel
            </button>
        `;

    const html = [...this.roundHistory]
      .reverse()
      .map((record) => {
        const resultsHTML = Object.entries(record.scores)
          .sort(([, a], [, b]) => a.rank - b.rank)
          .map(
            ([group, data]) => `
                    <div class="history-result">
                        ${group}组: 第${data.rank}名 (${data.score}分)
                    </div>
                `
          )
          .join("");

        return `
                <div class="history-item">
                    <div class="history-round">第${record.round}轮 - ${record.timestamp}</div>
                    <div class="history-results">${resultsHTML}</div>
                </div>
            `;
      })
      .join("");

    this.elements.historyList.innerHTML = html;

    // 添加导出按钮到历史记录区域标题旁
    const historySection = document.querySelector(".history h2");
    if (!historySection.querySelector(".export-btn")) {
      historySection.innerHTML = "📝 比赛历史 " + exportBtn;
    }
  }

  /**
   * 更新按钮状态
   */
  updateButtons() {
    // 开始新一轮按钮
    this.elements.startRoundBtn.style.display = this.isRoundInProgress
      ? "none"
      : "inline-block";

    // 提交成绩按钮
    this.elements.submitRoundBtn.style.display = this.isRoundInProgress
      ? "inline-block"
      : "none";
  }

  /**
   * 导出Excel
   */
  exportToExcel(type) {
    let data = [];
    let filename = "";

    if (type === "总分排行榜") {
      // 按总分排序，同分则按组别字母排序保持一致性
      const sortedGroups = [...this.groups].sort((a, b) => {
        const scoreA = this.totalScores[a] || 0;
        const scoreB = this.totalScores[b] || 0;
        if (scoreB === scoreA) {
          return a.localeCompare(b);
        }
        return scoreB - scoreA;
      });

      // 计算排名
      let currentRank = 1;
      const groupRanks = {};

      for (let i = 0; i < sortedGroups.length; i++) {
        const group = sortedGroups[i];
        const score = this.totalScores[group] || 0;

        if (i > 0) {
          const prevGroup = sortedGroups[i - 1];
          const prevScore = this.totalScores[prevGroup] || 0;
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
          this.totalScores[group] || 0,
        ]),
      ];
      filename = "弯道跑总分排行榜";
    } else if (type === "比赛历史") {
      data = [["轮次", "时间", "组别", "名次", "得分"]];

      this.roundHistory.forEach((record) => {
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

    this.downloadExcel(data, filename);
  }

  /**
   * 下载Excel文件
   */
  downloadExcel(data, filename) {
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

    this.showSuccessMessage(`${filename}已导出成功！`);
  }

  /**
   * 显示成功消息
   */
  showSuccessMessage(message) {
    // 创建临时提示元素
    const toast = document.createElement("div");
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #38a169;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2000;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;

    toast.textContent = message;
    document.body.appendChild(toast);

    // 添加动画样式
    const style = document.createElement("style");
    style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
    document.head.appendChild(style);

    // 3秒后自动移除
    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease-out reverse";
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
        if (style.parentNode) {
          document.head.removeChild(style);
        }
      }, 300);
    }, 3000);
  }
}

// 初始化弯道跑计分系统
function initScoringSystem() {
  // 如果已经初始化过，直接返回
  if (window.scoringSystem) {
    return;
  }

  // 创建全局实例
  window.scoringSystem = new ScoringSystem();
  console.log("弯道跑计分系统初始化完成");
}

// 页面卸载前保存数据
window.addEventListener("beforeunload", function () {
  if (window.scoringSystem) {
    window.scoringSystem.saveData();
  }
});
