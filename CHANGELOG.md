## [1.6.1](https://github.com/MerzoukeMansouri/sith/compare/v1.6.0...v1.6.1) (2026-05-17)


### Bug Fixes

* update publish workflow to use correct job output reference ([e6c1d7d](https://github.com/MerzoukeMansouri/sith/commit/e6c1d7d4c1fc97bc9c96bd0d308ff938be136a99))

# [1.6.0](https://github.com/MerzoukeMansouri/sith/compare/v1.5.4...v1.6.0) (2026-05-17)


### Features

* add docker build and push job to workflow ([aa329e0](https://github.com/MerzoukeMansouri/sith/commit/aa329e0eb94d5eb06077ff88bfac881822a450f0))

## [1.5.4](https://github.com/MerzoukeMansouri/sith/compare/v1.5.3...v1.5.4) (2026-05-16)


### Bug Fixes

* update npm config to use public registry via RUN command ([2439108](https://github.com/MerzoukeMansouri/sith/commit/243910880b16f4ae8a5918176996e814307f123d))

## [1.5.3](https://github.com/MerzoukeMansouri/sith/compare/v1.5.2...v1.5.3) (2026-05-16)


### Bug Fixes

* pdate build script and add docker to files ([530e6d6](https://github.com/MerzoukeMansouri/sith/commit/530e6d65e14072ca5905424cf8c2e73728938ae8))

## [1.5.2](https://github.com/MerzoukeMansouri/sith/compare/v1.5.1...v1.5.2) (2026-05-16)


### Bug Fixes

* use npx to run latest npm for Trusted Publishers support ([eaf3e7d](https://github.com/MerzoukeMansouri/sith/commit/eaf3e7d657a71fbe09f483efb49c66df4fe60b7a))

## [1.5.1](https://github.com/MerzoukeMansouri/sith/compare/v1.5.0...v1.5.1) (2026-05-16)


### Bug Fixes

* upgrade npm to support Trusted Publishers (requires v11.5.1+) ([3e6dd82](https://github.com/MerzoukeMansouri/sith/commit/3e6dd82ac53e09d4a22c7cd7bc3bc04a26d53df2))

# [1.5.0](https://github.com/MerzoukeMansouri/sith/compare/v1.4.2...v1.5.0) (2026-05-16)


### Features

* switch back to OIDC Trusted Publisher after npm config update ([53cf7b1](https://github.com/MerzoukeMansouri/sith/commit/53cf7b15a8c59d05cf69ab1a7f76aa353c9d6ca4))

## [1.4.2](https://github.com/MerzoukeMansouri/sith/compare/v1.4.1...v1.4.2) (2026-05-16)


### Bug Fixes

* temporarily restore NPM_TOKEN for publishing ([c0733c5](https://github.com/MerzoukeMansouri/sith/commit/c0733c5d0a92ce06b37b3fdf5caf73d525e482f0))

## [1.4.1](https://github.com/MerzoukeMansouri/sith/compare/v1.4.0...v1.4.1) (2026-05-16)


### Bug Fixes

* correct release detection logic in workflow ([fdff493](https://github.com/MerzoukeMansouri/sith/commit/fdff493dbf92e1affd118149ad56a37809b070ed))

# [1.4.0](https://github.com/MerzoukeMansouri/sith/compare/v1.3.2...v1.4.0) (2026-05-16)


### Features

* enable OIDC Trusted Publisher for secure npm publishing ([7c6f1bd](https://github.com/MerzoukeMansouri/sith/commit/7c6f1bdc58fea94325341b9e108bd91347cfdd5f))

## [1.3.2](https://github.com/MerzoukeMansouri/sith/compare/v1.3.1...v1.3.2) (2026-05-16)


### Bug Fixes

* only publish when semantic-release creates new version ([7edd3f7](https://github.com/MerzoukeMansouri/sith/commit/7edd3f7ab041b4ca7abbb2e9079f789f767c2e02))

## [1.3.1](https://github.com/MerzoukeMansouri/sith/compare/v1.3.0...v1.3.1) (2026-05-16)


### Bug Fixes

* correct package scope to @m14i/sith for npm publishing ([ea072a7](https://github.com/MerzoukeMansouri/sith/commit/ea072a755216b0fa82616547d1e13916e802935a))

# [1.3.0](https://github.com/MerzoukeMansouri/sith/compare/v1.2.0...v1.3.0) (2026-05-16)


### Features

* add GitHub Packages publishing and update package name ([f9ca39b](https://github.com/MerzoukeMansouri/sith/commit/f9ca39bb7f592a0c9bb4476385554f786dc1cc9d))

# [1.2.0](https://github.com/MerzoukeMansouri/sith/compare/v1.1.0...v1.2.0) (2026-05-16)


### Features

* remove GitHub Packages publishing and update metadata ([6b11d64](https://github.com/MerzoukeMansouri/sith/commit/6b11d64d99dcd995923c5d77e8d55001706d2107))

# [1.1.0](https://github.com/MerzoukeMansouri/sith/compare/v1.0.0...v1.1.0) (2026-05-16)


### Features

* update release workflow to use explicit release info step ([3bd150c](https://github.com/MerzoukeMansouri/sith/commit/3bd150c70d2dc209008d2330d32238fdd3370bd8))

# 1.0.0 (2026-05-16)


### Features

* add interactive menu, logo, and cspell config ([0520e32](https://github.com/MerzoukeMansouri/sith/commit/0520e32b11d9e51c4a427046ad21637c8e0eb185))
* add semantic release and publish to npm & github packages ([a958229](https://github.com/MerzoukeMansouri/sith/commit/a95822948250ddf619aedc4273d15a4668825066))
