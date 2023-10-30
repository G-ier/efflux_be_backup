AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 524744845066
AWS_PROFILE ?= efflux
STACK_NAME ?= Efflux-BE

deploy-stack:
	@aws cloudformation deploy \
		--stack-name $(STACK_NAME) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM  \
		--template-file be-template.yaml \
		--parameter-overrides \
			ProjectName=efflux \
			OperatorEmail=ilyas@ad.roi\
    --tags \
      project=efflux \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)

destroy-stack:
	@aws cloudformation delete-stack \
		--stack-name $(STACK_NAME) \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)
