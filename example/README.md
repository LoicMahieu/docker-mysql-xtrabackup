
```sh
# Create MySQL
helm install --name mysql-test --namespace mysql-test -f ./mysql/values.yaml --set fullnameOverride=mysql stable/mysql

# Create backup
kubectl create -n mysql-test -f ./mysql-backup-pvc.yaml
kubectl create -n mysql-test -f ./mysql-backup-secret.yaml
kubectl create -n mysql-test -f ./mysql-backup-cronjob.yaml
```
