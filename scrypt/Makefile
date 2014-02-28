NODE_GYP ?= ../node_modules/.bin/node-gyp

# Default
all: pnacl em node

clean:
	rm -f module.pexe
	rm -f module.bc
	rm -f module.js
	rm -f scrypt.node
	$(NODE_GYP) clean

veryclean: clean
	rm -f ../public/module.pexe
	rm -f module.min.js

module.bc: pnaclsetup pnacl.cc
	$(PNACL_CXX) scrypt/*.cc -o module.bc pnacl.cc -O2 $(CXXFLAGS) $(LDFLAGS)

pnacl: pnaclsetup module.bc
	$(PNACL_FINALIZE) module.bc -o module.pexe
	cp module.pexe ../public/module.pexe

node:
	$(NODE_GYP) configure build
	cp build/Release/scrypt.node scrypt.node

em: emsetup
	$(PY) $(EM) --pre-js pre-js.js --post-js post-js.js -O2 -s EXPORTED_FUNCTIONS="['_SCRYPT']" -o module.js scrypt/*.cc
	$(PY) $(EM) --pre-js pre-js.js --post-js post-js.js -O2 --closure 1 -s EXPORTED_FUNCTIONS="['_SCRYPT']" -o module.min.js scrypt/*.cc

emsetup:
PY = `which python`
EM = `which em++`

pnaclsetup:
ifndef NACL_SDK_ROOT
	$(error NACL_SDK_ROOT is required for PNaCL. To only build the Node.js module, use "make node")
endif

# Project build flags
WARNINGS = -Wno-long-long -Wall -Wswitch-enum -pedantic -Werror
CXXFLAGS = -pthread -std=gnu++98 $(WARNINGS)

# Compute tool paths
GETOS = python $(NACL_SDK_ROOT)/tools/getos.py
OSNAME = $(shell $(GETOS))

# PNACL paths
PNACL_TC_PATH = $(abspath $(NACL_SDK_ROOT)/toolchain/$(OSNAME)_pnacl)
PNACL_CXX = $(PNACL_TC_PATH)/bin/pnacl-clang++
PNACL_FINALIZE = $(PNACL_TC_PATH)/bin/pnacl-finalize
CXXFLAGS = -I$(NACL_SDK_ROOT)/include
LDFLAGS = -L$(NACL_SDK_ROOT)/lib/pnacl/Release -lppapi_cpp -lppapi
