import subprocess
from flask import Flask

gitdir = "/var/www"
gitrepo = "git@github.com:PimsJay01/vertigo.git"

app = Flask(__name__)

def git(*args):
    subprocess.check_call(['git'] + list(args))

@app.route('/refresh',methods=['POST','GET'])
def reload():
    git("-C",gitdir,"pull")
    return "Refreshed"

if __name__ == '__main__':
    app.run('0.0.0.0')
