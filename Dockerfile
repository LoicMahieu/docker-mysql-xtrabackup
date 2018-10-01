FROM mysql:5.6

ADD ./scripts /backup-scripts

RUN apt-get update && \
    apt-get install -y curl wget lsb-release python python-pip trickle && \
    echo "Install Percona XtraBackup" && \
    wget https://repo.percona.com/apt/percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    dpkg -i percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    rm -f percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    apt-get update && \
    apt-get install -y percona-xtrabackup-24 && \
    echo "Install Google Cloud SDK" && \
    curl https://sdk.cloud.google.com | bash && \
    echo "Install crc mod for gsutil" && \
    pip install crcmod && \
    echo "Install Node.js" && \
    curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    echo "Install yarn" && \
    curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn && \
    echo "Install backup-scripts" && \
    cd /backup-scripts && \
    yarn install --pure-lockfile && \
    yarn build && \
    yarn install --production --pure-lockfile && \
    chmod +x ./bin/xtrabackup-runner && \
    echo "Clean" && \
    apt-get remove -y lsb-release wget curl yarn python-pip && \
    rm -rf /var/lib/apt/lists/*

ENV PATH="$PATH:/root/google-cloud-sdk/bin"
