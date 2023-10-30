AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 524744845066
AWS_PROFILE ?= efflux
EFFLUX_BE_STACK_NAME ?= Efflux-BE
EFFLUX_DATA_INGESTION_STACK_NAME ?= efflux-data-ingestion

deploy-stack:
	@aws cloudformation deploy \
		--stack-name $(EFFLUX_BE_STACK_NAME) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM  \
		--template-file be-template.yaml \
		--parameter-overrides \
			ProjectName=efflux \
			OperatorEmail=ilyas@ad.roi\
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION) \

destroy-stack:
	@aws cloudformation delete-stack \
		--stack-name $(EFFLUX_BE_STACK_NAME) \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION) \
