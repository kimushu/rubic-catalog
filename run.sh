#!/bin/sh
cd $(dirname $0)
log=$(mktemp)
/usr/bin/npm run auto-update > ${log} 2>&1
ret=$?
if [ ${ret} -ne 0 ]; then
  cat ${log}
fi
rm ${log}
exit ${ret}

