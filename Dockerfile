FROM mysql:5.6

RUN apt-get update && \
    apt-get install -y curl wget lsb-release python python-pip && \
    echo "Install Percona XtraBackup" && \
    wget https://repo.percona.com/apt/percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    dpkg -i percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    rm -f percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    apt-get update && \
    apt-get install -y percona-xtrabackup-24 && \
    echo "Install AWS cli" && \
    pip install awscli && \
    echo "Install Node.js" && \
    curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    echo "Clean" && \
    apt-get remove -y lsb-release wget curl && \
    apt autoremove -y && \
    rm -rf /var/lib/apt/lists/*
