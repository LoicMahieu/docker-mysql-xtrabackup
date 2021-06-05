FROM node:15 as build

COPY ./package.json ./yarn.lock /build/
WORKDIR /build
RUN yarn install --pure-lockfile
COPY . /build
RUN yarn build

FROM mysql:5.6@sha256:e29f4d4b43951c766cd6bacca8d05ac545ec76bb7f42e798bed5e2038c5e2753

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

RUN mkdir -p /app/bin
COPY --from=build /build/bin/xtrabackup-runner /app/bin/xtrabackup-runner
COPY --from=build /build/node_modules /app/node_modules
RUN ln -s /app/bin/xtrabackup-runner /usr/local/bin/xtrabackup-runner

