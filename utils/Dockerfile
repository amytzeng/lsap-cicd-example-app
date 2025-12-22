FROM jenkins/jenkins:lts
USER root

# 安裝 Linux 版 Docker CLI 與 libatomic1
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    libatomic1 && \
    # 確保目錄存在，避免 tee 報錯
    mkdir -m 0755 -p /etc/apt/keyrings /etc/apt/sources.list.d && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# 將 jenkins 使用者加入 root 群組以存取 macOS 虛擬機的 socket
RUN usermod -aG root jenkins

USER jenkins