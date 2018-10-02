FROM node:10.10.0 as build

ADD . /build
WORKDIR /build
RUN yarn install --pure-lockfile
RUN yarn build

FROM mysql:5.6

RUN apt-get update && \
    apt-get install -y curl wget lsb-release python python-pip && \
    echo "Install Percona XtraBackup" && \
    wget https://repo.percona.com/apt/percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    dpkg -i percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    rm -f percona-release_0.1-6.$(lsb_release -sc)_all.deb && \
    apt-get update && \
    apt-get install -y percona-xtrabackup-24 && \
    echo "Install Google Cloud SDK" && \
    echo "deb http://packages.cloud.google.com/apt cloud-sdk-$(lsb_release -c -s) main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update && apt-get install -y google-cloud-sdk && \
    echo "Install crc mod for gsutil" && \
    pip install crcmod && \
    echo "Install Node.js" && \
    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get install -y nodejs && \
    echo "Clean" && \
    apt-get remove -y lsb-release wget curl python-pip && \
    rm -rf /var/lib/apt/lists/*
ENV PATH="$PATH:/root/google-cloud-sdk/bin"

COPY --from=build /build/bin/xtrabackup-runner /usr/local/bin/xtrabackup-runner
