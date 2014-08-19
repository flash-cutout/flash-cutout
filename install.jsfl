

function check() {
  var version = parseInt(fl.version.match(/\d+/)[0]);
  if (version < 12) {
    alert('Cutout插件不能安装在这个版本的Flash中。\n\n需要CS6或者以上版本。');
    return false;
  }

  // check user is not installing into the Flash Configuration folder
  if (fl.scriptURI.indexOf(fl.configURI) === 0) {
    alert('请把安装文件拷贝到Flash配置目录以外的目录进行安装。');
    return false;
  }
  return true;
}

function install() {
  var root = fl.scriptURI.replace('install.jsfl', ''),
    cmd = fl.configURI + 'Commands/',
    dest = cmd + "Export Cutouts.jsfl",
    devproxy = root + "dev/Commands/Export Cutouts.jsfl",
    src = devproxy;

  if (confirm("是否安装开发版本？\n\n美术设计师请选“取消”。")) {
    FLfile.write(cmd + 'Cutout.ini', root);
  } else {
    FLfile.remove(cmd + 'Cutout.ini');
    src = root + "Cutout.jsfl";
  }

  FLfile.remove(dest);
  FLfile.copy(src, dest);

  alert("安装成功！\n\n用法:\n  命令->Export Cutouts");
}

(function() {

  if (check()) {
    install();
  }
})();
