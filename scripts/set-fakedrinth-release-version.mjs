import fs from 'node:fs'

const tag = process.argv[2]
const match = /^fakedrinth-v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag ?? '')

if (!match) {
	throw new Error(`Expected a release tag like fakedrinth-v1.2.3, received: ${tag ?? '(none)'}`)
}

const version = match[1]
const frontendPath = 'apps/app-frontend/package.json'
const frontend = JSON.parse(fs.readFileSync(frontendPath, 'utf8'))
frontend.version = version
fs.writeFileSync(frontendPath, `${JSON.stringify(frontend, null, '\t')}\n`)

for (const path of ['apps/app/Cargo.toml', 'packages/app-lib/Cargo.toml']) {
	const contents = fs.readFileSync(path, 'utf8')
	const updated = contents.replace(/^(version = ")[^"]+("$)/m, `$1${version}$2`)
	if (updated === contents) {
		throw new Error(`Could not update package version in ${path}`)
	}
	fs.writeFileSync(path, updated)
}

console.log(`Set FAKEDRINH release version to ${version}`)
