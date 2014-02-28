#include <v8.h>

#include <node.h>
#include <node_buffer.h>

#include "scrypt/scrypt.hh"

using namespace v8;
using namespace node;

Handle<Value> Method(const Arguments& args) {
	HandleScope scope;
	
	if (args.Length() != 1) {
		ThrowException(Exception::TypeError(String::New("No Arguments")));
		return scope.Close(Undefined());
	}
	
	if (!args[0]->IsObject()) {
		ThrowException(Exception::TypeError(String::New("Scrypt Requires Buffer")));
		return scope.Close(Undefined());
	}
	
	unsigned char *input = (unsigned char *)Buffer::Data(args[0]);
	unsigned char output[32];
	
	SCRYPT(input, output);
	
	Buffer *bufferOut = Buffer::New((char *)output, 32);
	
	return scope.Close(bufferOut->handle_);
}

void init(Handle<Object> exports) {
	exports->Set(String::NewSymbol("scrypt"), FunctionTemplate::New(Method)->GetFunction());
}

NODE_MODULE(scrypt, init)
